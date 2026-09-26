import { Perfil } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/async-handler'
import { prisma } from '../lib/prisma'
import { allowRoles } from '../middleware/auth'

export const productsRouter = Router()
const productSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  categoria: z.string().trim().min(2).max(60),
  quantidade: z.number().int().min(0),
  preco: z.number().positive().max(999999),
})
const productUpdateSchema = productSchema.partial().refine((value) => Object.keys(value).length > 0)
const toPublicProduct = (product: { id: string; nome: string; categoria: string; quantidade: number; preco: { toNumber(): number } }) => ({ ...product, preco: product.preco.toNumber() })

productsRouter.get('/', asyncHandler(async (_req, res) => {
  const products = await prisma.itemEstoque.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } })
  return res.json(products.map(toPublicProduct))
}))

productsRouter.post('/', allowRoles(Perfil.GESTOR), asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body)
  const product = await prisma.itemEstoque.create({ data })
  return res.status(201).json(toPublicProduct(product))
}))

productsRouter.patch('/:id', allowRoles(Perfil.GESTOR), asyncHandler(async (req, res) => {
  const id = z.string().parse(req.params.id)
  const data = productUpdateSchema.parse(req.body)
  const product = await prisma.itemEstoque.update({ where: { id }, data })
  return res.json(toPublicProduct(product))
}))

productsRouter.delete('/:id', allowRoles(Perfil.GESTOR), asyncHandler(async (req, res) => {
  const id = z.string().parse(req.params.id)
  await prisma.itemEstoque.update({ where: { id }, data: { ativo: false } })
  return res.status(204).end()
}))