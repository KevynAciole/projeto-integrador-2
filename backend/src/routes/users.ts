import { Perfil } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/async-handler'
import { prisma } from '../lib/prisma'
import { allowRoles, type AuthUser } from '../middleware/auth'

export const usersRouter = Router()
const createSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  nome: z.string().trim().min(2).max(120),
  perfil: z.nativeEnum(Perfil).default(Perfil.CONDOMINO),
  unidadeId: z.string().optional(),
})
const updateSchema = createSchema.partial().omit({ email: true })

usersRouter.get('/', allowRoles(Perfil.GESTOR, Perfil.SINDICO), asyncHandler(async (_req, res) => {
  const users = await prisma.usuario.findMany({ include: { unidade: true }, orderBy: { nome: 'asc' } })
  return res.json(users.map(({ id, email, nome, perfil, unidadeId, unidade }) => ({ id, email, nome, perfil: perfil.toLowerCase(), unidadeId, unidade })))
}))

usersRouter.post('/', allowRoles(Perfil.GESTOR, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const actor = req.user as AuthUser
  const data = createSchema.parse(req.body)
  if (actor.perfil === Perfil.SINDICO && data.perfil !== Perfil.CONDOMINO) return res.status(403).json({ error: 'Síndicos podem cadastrar apenas condôminos.' })
  const user = await prisma.usuario.create({ data })
  return res.status(201).json({ id: user.id, email: user.email, nome: user.nome, perfil: user.perfil.toLowerCase(), unidadeId: user.unidadeId })
}))

usersRouter.patch('/:id', allowRoles(Perfil.GESTOR, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const actor = req.user as AuthUser
  const id = z.string().parse(req.params.id)
  const data = updateSchema.parse(req.body)
  const target = await prisma.usuario.findUniqueOrThrow({ where: { id } })
  if (actor.perfil === Perfil.SINDICO && target.perfil !== Perfil.CONDOMINO) return res.status(403).json({ error: 'Síndicos podem editar apenas condôminos.' })
  if (actor.perfil === Perfil.SINDICO && data.perfil && data.perfil !== Perfil.CONDOMINO) return res.status(403).json({ error: 'Síndicos não podem atribuir este perfil.' })
  const user = await prisma.usuario.update({ where: { id: target.id }, data })
  return res.json({ id: user.id, email: user.email, nome: user.nome, perfil: user.perfil.toLowerCase(), unidadeId: user.unidadeId })
}))