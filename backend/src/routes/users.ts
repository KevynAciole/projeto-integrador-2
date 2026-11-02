import bcrypt from 'bcryptjs'
import { Perfil } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { createTemporaryPassword, createUserNumber, normalizePhone } from '../lib/accounts'
import { asyncHandler } from '../lib/async-handler'
import { sendTemporaryCredentials } from '../lib/mail'
import { prisma } from '../lib/prisma'
import { allowRoles, type AuthUser } from '../middleware/auth'

export const usersRouter = Router()
const updateSchema = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  perfil: z.nativeEnum(Perfil).optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  telefone: z.string().trim().optional().transform((value) => value ? normalizePhone(value) : undefined),
  unidadeId: z.string().trim().min(1).nullable().optional(),
})

usersRouter.get('/', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (_req, res) => {
  const incluiExcluidos = _req.query.incluiExcluidos === 'true'
  const users = await prisma.usuario.findMany({
    where: incluiExcluidos ? {} : { excluidoEm: null },
    include: { unidade: true },
    orderBy: { nome: 'asc' },
  })
  return res.json(users.map(({ id, numeroUsuario, email, emailContato, telefone, nome, perfil, unidadeId, unidade, deveTrocarSenha, excluidoEm }) => ({
    id, numeroUsuario, email: email ?? emailContato, telefone, nome, perfil: perfil.toLowerCase(), unidadeId, unidade, deveTrocarSenha, excluidoEm,
  })))
}))

usersRouter.post('/', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const actor = req.user as AuthUser
  const data = createUserSchema.parse(req.body)
  if (actor.perfil === Perfil.SINDICO && data.perfil === Perfil.ADMIN) return res.status(403).json({ error: 'Síndicos não podem cadastrar administradores.' })

  const senhaTemporaria = createTemporaryPassword()
  const user = await prisma.$transaction(async (transaction) => {
    const created = await transaction.usuario.create({
      data: {
        numeroUsuario: await createUserNumber(transaction),
        email: data.email,
        emailContato: data.email,
        telefone: data.telefone ?? null,
        senhaHash: await bcrypt.hash(senhaTemporaria, 12),
        deveTrocarSenha: true,
        nome: data.nome,
        perfil: data.perfil,
        ...(data.unidadeId ? { unidade: { connect: { id: data.unidadeId } } } : {}),
      },
    })
    await sendTemporaryCredentials({ to: created.emailContato, nome: created.nome, numeroUsuario: created.numeroUsuario, senhaTemporaria })
    return created
  }, { maxWait: 10000, timeout: 20000 })

  await prisma.auditoria.create({
    data: {
      acao: 'CADASTRO_USUARIO',
      detalhes: `Usuário ${user.nome} cadastrado com perfil ${user.perfil}.`,
      usuarioId: actor.id,
      usuarioNome: actor.nome,
      ipAddress: req.ip ?? undefined,
    },
  })

  return res.status(201).json({ id: user.id, numeroUsuario: user.numeroUsuario, email: user.email, telefone: user.telefone, nome: user.nome, perfil: user.perfil.toLowerCase(), unidadeId: user.unidadeId, deveTrocarSenha: user.deveTrocarSenha, notificacaoEnviada: true })
}))

usersRouter.patch('/:id', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const actor = req.user as AuthUser
  const id = z.string().parse(req.params.id)
  const data = updateSchema.parse(req.body)
  const target = await prisma.usuario.findUniqueOrThrow({ where: { id } })
  if (actor.perfil === Perfil.SINDICO && (target.perfil === Perfil.ADMIN || data.perfil === Perfil.ADMIN)) return res.status(403).json({ error: 'Síndicos não podem alterar administradores.' })
  const nextProfile = data.perfil ?? target.perfil
  const nextUnit = data.unidadeId === undefined ? target.unidadeId : data.unidadeId
  const nextEmail = data.email ?? target.email ?? target.emailContato
  if (nextProfile === Perfil.CONDOMINO && (!nextEmail || !(data.telefone ?? target.telefone) || !nextUnit)) return res.status(400).json({ error: 'Condôminos precisam de e-mail, telefone e unidade.' })
  if (nextProfile === Perfil.VISITANTE && nextUnit) return res.status(400).json({ error: 'Visitantes não podem ser vinculados a uma unidade.' })

  const { unidadeId, email, ...userFields } = data
  const unitUpdate = unidadeId === undefined ? {} : unidadeId ? { unidade: { connect: { id: unidadeId } } } : { unidade: { disconnect: true } }
  const user = await prisma.$transaction(async (transaction) => {
    const updatedUser = await transaction.usuario.update({
      where: { id },
      data: { ...userFields, ...(email !== undefined ? { email, emailContato: email } : {}), ...unitUpdate },
    })
    if (!target.unidadeId && unidadeId) {
      await transaction.compra.updateMany({
        where: { usuarioId: id, unidadeId: null },
        data: { unidadeId },
      })
    }
    return updatedUser
  })
  return res.json({ id: user.id, numeroUsuario: user.numeroUsuario, email: user.email ?? user.emailContato, telefone: user.telefone, nome: user.nome, perfil: user.perfil.toLowerCase(), unidadeId: user.unidadeId, deveTrocarSenha: user.deveTrocarSenha })
}))

usersRouter.delete('/:id', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const actor = req.user as AuthUser
  const id = z.string().parse(req.params.id)
  if (actor.id === id) return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário.' })

  const target = await prisma.usuario.findUnique({ where: { id } })
  if (!target || target.excluidoEm) return res.status(404).json({ error: 'Usuário ativo não encontrado.' })
  if (actor.perfil === Perfil.SINDICO && target.perfil === Perfil.ADMIN) return res.status(403).json({ error: 'Síndicos não podem excluir administradores.' })

  await prisma.$transaction(async (transaction) => {
    await transaction.usuario.update({ where: { id }, data: { excluidoEm: new Date() } })
    await transaction.auditoria.create({
      data: {
        acao: 'EXCLUIR_USUARIO',
        detalhes: `Usuário ${target.nome} excluído logicamente.`,
        usuarioId: actor.id,
        usuarioNome: actor.nome,
        ipAddress: req.ip ?? undefined,
      },
    })
  })

  return res.status(204).end()
}))

usersRouter.post('/:id/restaurar', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const actor = req.user as AuthUser
  const id = z.string().parse(req.params.id)
  const target = await prisma.usuario.findUnique({ where: { id } })
  if (!target || !target.excluidoEm) return res.status(404).json({ error: 'Usuário excluído não encontrado.' })
  if (actor.perfil === Perfil.SINDICO && target.perfil === Perfil.ADMIN) return res.status(403).json({ error: 'Síndicos não podem restaurar administradores.' })

  await prisma.$transaction(async (transaction) => {
    await transaction.usuario.update({ where: { id }, data: { excluidoEm: null } })
    await transaction.auditoria.create({
      data: {
        acao: 'RESTAURAR_USUARIO',
        detalhes: `Usuário ${target.nome} restaurado.`,
        usuarioId: actor.id,
        usuarioNome: actor.nome,
        ipAddress: req.ip ?? undefined,
      },
    })
  })

  return res.status(204).end()
}))

export const createUserSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  perfil: z.nativeEnum(Perfil),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  telefone: z.string().trim().optional().transform((value) => value ? normalizePhone(value) : undefined),
  unidadeId: z.string().optional(),
}).superRefine((data, context) => {
  if (data.perfil === Perfil.CONDOMINO) {
    if (!data.telefone || data.telefone.length < 10 || data.telefone.length > 15) context.addIssue({ code: z.ZodIssueCode.custom, path: ['telefone'], message: 'Informe um telefone válido para o condômino.' })
    if (!data.unidadeId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['unidadeId'], message: 'Condôminos devem estar vinculados a uma unidade.' })
  }
  if (data.perfil === Perfil.VISITANTE && data.unidadeId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['unidadeId'], message: 'Visitantes não podem ser vinculados a uma unidade.' })
  if (data.telefone && (data.telefone.length < 10 || data.telefone.length > 15)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['telefone'], message: 'Informe um telefone com 10 a 15 dígitos.' })
})