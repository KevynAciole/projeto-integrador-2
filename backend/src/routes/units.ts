import { Perfil, Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/async-handler'
import { prisma } from '../lib/prisma'
import { allowRoles, type AuthUser } from '../middleware/auth'

export const unitsRouter = Router()
const unitSchema = z.object({ numero: z.string().trim().regex(/^\d{1,20}$/, 'O número da unidade deve conter apenas números.'), bloco: z.string().trim().max(20).optional() })
const duplicateUnitError = 'Já existe uma unidade com este número neste bloco.'

function isDuplicateUnitError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

unitsRouter.get('/', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (_req, res) => {
  const units = await prisma.unidade.findMany({ include: { moradores: { where: { excluidoEm: null }, select: { id: true, nome: true, email: true } }, _count: { select: { moradores: true, compras: true } } }, orderBy: [{ bloco: 'asc' }, { numero: 'asc' }] })
  return res.json(units)
}))

unitsRouter.post('/', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const data = unitSchema.parse(req.body)
  let unit: Awaited<ReturnType<typeof prisma.unidade.create>>
  try {
    unit = await prisma.unidade.create({ data })
  } catch (error) {
    if (isDuplicateUnitError(error)) return res.status(409).json({ error: duplicateUnitError })
    throw error
  }
  return res.status(201).json(unit)
}))

unitsRouter.patch('/:id', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const id = z.string().parse(req.params.id)
  const data = unitSchema.partial().refine((value) => Object.keys(value).length > 0).parse(req.body)
  let unit: Awaited<ReturnType<typeof prisma.unidade.update>>
  try {
    unit = await prisma.unidade.update({ where: { id }, data })
  } catch (error) {
    if (isDuplicateUnitError(error)) return res.status(409).json({ error: duplicateUnitError })
    throw error
  }
  return res.json(unit)
}))

unitsRouter.delete('/:id', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const id = z.string().parse(req.params.id)
  const unit = await prisma.unidade.findUnique({
    where: { id },
    select: { id: true, _count: { select: { moradores: true, compras: true } } },
  })
  if (!unit) return res.status(404).json({ error: 'Unidade não encontrada.' })
  if (unit._count.moradores > 0 || unit._count.compras > 0) {
    return res.status(409).json({ error: 'Não é possível excluir uma unidade com moradores ou compras vinculadas.' })
  }
  await prisma.unidade.delete({ where: { id } })
  return res.status(204).end()
}))

unitsRouter.get('/minha-unidade', allowRoles(Perfil.CONDOMINO), asyncHandler(async (req, res) => {
  const user = req.user as AuthUser
  if (!user.unidadeId) return res.status(404).json({ error: 'Nenhuma unidade vinculada ao seu cadastro.' })
  const unit = await prisma.unidade.findUniqueOrThrow({
    where: { id: user.unidadeId },
    select: {
      id: true,
      numero: true,
      bloco: true,
      moradores: {
        where: { excluidoEm: null },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
      },
      compras: {
        orderBy: { data: 'desc' },
        take: 200,
        select: {
          id: true,
          data: true,
          quantidade: true,
          valor: true,
          usuario: { select: { nome: true } },
          item: { select: { nome: true, categoria: true } },
        },
      },
    },
  })
  return res.json({ ...unit, compras: unit.compras.map((purchase) => ({ ...purchase, valor: purchase.valor.toNumber() })) })
}))