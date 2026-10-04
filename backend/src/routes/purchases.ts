import { Perfil, Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/async-handler'
import { prisma } from '../lib/prisma'
import { registrarAuditoria } from '../lib/auditoria'
import { allowRoles, type AuthUser } from '../middleware/auth'

export const purchasesRouter = Router()
const purchaseSchema = z.object({ itemId: z.string().min(1), quantidade: z.number().int().positive().max(100) })
const purchaseInclude = { usuario: { select: { id: true, nome: true } }, unidade: { select: { id: true, numero: true, bloco: true } }, item: { select: { id: true, nome: true, categoria: true } } } as const

purchasesRouter.get('/', allowRoles(Perfil.ADMIN, Perfil.SINDICO, Perfil.ESTOQUISTA, Perfil.CONDOMINO), asyncHandler(async (req, res) => {
  const user = req.user as AuthUser
  const where = user.perfil === Perfil.CONDOMINO || user.perfil === Perfil.ESTOQUISTA ? { usuarioId: user.id } : {}
  const purchases = await prisma.compra.findMany({ where, include: purchaseInclude, orderBy: { data: 'desc' }, take: 200 })
  return res.json(purchases.map((purchase) => ({ ...purchase, valor: purchase.valor.toNumber() })))
}))

purchasesRouter.post('/', allowRoles(Perfil.CONDOMINO, Perfil.SINDICO, Perfil.ADMIN, Perfil.ESTOQUISTA), asyncHandler(async (req, res) => {
  const user = req.user as AuthUser
  if (user.perfil === Perfil.CONDOMINO && !user.unidadeId) return res.status(400).json({ error: 'Vincule sua conta a uma unidade antes de comprar.' })
  const { itemId, quantidade } = purchaseSchema.parse(req.body)

  const purchase = await prisma.$transaction(async (transaction) => {
    const item = await transaction.itemEstoque.findFirst({ where: { id: itemId, ativo: true } })
    if (!item) throw new PurchaseError(404, 'Produto não encontrado.')
    const updated = await transaction.itemEstoque.updateMany({ where: { id: itemId, ativo: true, quantidade: { gte: quantidade } }, data: { quantidade: { decrement: quantidade } } })
    if (updated.count !== 1) throw new PurchaseError(409, 'Estoque insuficiente para esta quantidade.')
    const valor = new Prisma.Decimal(item.preco).mul(quantidade)
    return transaction.compra.create({ data: { usuarioId: user.id, unidadeId: user.unidadeId, itemId, quantidade, valor }, include: purchaseInclude })
  })

  await registrarAuditoria({ acao: 'REGISTRAR_COMPRA', detalhes: `Compra ${purchase.id} registrada para ${user.nome} (${user.perfil}).`, usuarioId: user.id, usuarioNome: user.nome, ipAddress: req.ip ?? undefined })

  return res.status(201).json({ ...purchase, valor: purchase.valor.toNumber() })
}))

export class PurchaseError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}