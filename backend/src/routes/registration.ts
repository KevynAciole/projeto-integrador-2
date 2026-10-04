import bcrypt from 'bcryptjs'
import { Perfil } from '@prisma/client'
import { Router } from 'express'
import { createTemporaryPassword, createUserNumber } from '../lib/accounts'
import { asyncHandler } from '../lib/async-handler'
import { sendTemporaryCredentials } from '../lib/mail'
import { prisma } from '../lib/prisma'
import { createUserSchema } from './users'

export const registrationRouter = Router()

registrationRouter.get('/unidades', asyncHandler(async (_req, res) => {
  const units = await prisma.unidade.findMany({
    select: { id: true, numero: true, bloco: true },
    orderBy: [{ bloco: 'asc' }, { numero: 'asc' }],
  })
  return res.json(units)
}))

registrationRouter.post('/', asyncHandler(async (req, res) => {
  const data = createUserSchema.parse({ ...req.body, perfil: Perfil.CONDOMINO })
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
        perfil: Perfil.CONDOMINO,
        unidade: data.unidadeId ? { connect: { id: data.unidadeId } } : undefined,
      },
    })
    await sendTemporaryCredentials({ to: created.emailContato, nome: created.nome, numeroUsuario: created.numeroUsuario, senhaTemporaria })
    return created
  }, { maxWait: 10000, timeout: 20000 })

  return res.status(201).json({
    id: user.id,
    numeroUsuario: user.numeroUsuario,
    email: user.email,
    telefone: user.telefone,
    nome: user.nome,
    perfil: user.perfil.toLowerCase(),
    unidadeId: user.unidadeId,
    deveTrocarSenha: user.deveTrocarSenha,
    notificacaoEnviada: true,
  })
}))
