import { Perfil } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/async-handler'
import { prisma } from '../lib/prisma'
import { allowRoles, type AuthUser } from '../middleware/auth'

export const unitsRouter = Router()
const unitSchema = z.object({ numero: z.string().trim().min(1).max(20), bloco: z.string().trim().max(20).optional() })

unitsRouter.get('/', allowRoles(Perfil.GESTOR, Perfil.SINDICO), asyncHandler(async (_req, res) => {
  const units = await prisma.unidade.findMany({ include: { moradores: { select: { id: true, nome: true, email: true } }, _count: { select: { compras: true } } }, orderBy: [{ bloco: 'asc' }, { numero: 'asc' }] })
  return res.json(units)
}))

unitsRouter.post('/', allowRoles(Perfil.GESTOR, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const data = unitSchema.parse(req.body)
  const unit = await prisma.unidade.create({ data })
  return res.status(201).json(unit)
}))

unitsRouter.patch('/:id', allowRoles(Perfil.GESTOR, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const id = z.string().parse(req.params.id)
  const data = unitSchema.partial().refine((value) => Object.keys(value).length > 0).parse(req.body)
  const unit = await prisma.unidade.update({ where: { id }, data })
  return res.json(unit)
}))

unitsRouter.get('/minha-unidade', allowRoles(Perfil.CONDOMINO), asyncHandler(async (req, res) => {
  const user = req.user as AuthUser
  if (!user.unidadeId) return res.status(404).json({ error: 'Nenhuma unidade vinculada ao seu cadastro.' })
  const unit = await prisma.unidade.findUniqueOrThrow({ where: { id: user.unidadeId }, include: { moradores: { select: { id: true, nome: true } } } })
  return res.json(unit)
}))