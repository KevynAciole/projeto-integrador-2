import { Perfil } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/async-handler'
import { prisma } from '../lib/prisma'
import { allowRoles } from '../middleware/auth'

export const reportsRouter = Router()
const reportQuery = z.object({ mes: z.coerce.number().int().min(1).max(12).optional(), ano: z.coerce.number().int().min(2020).max(2100).optional() })

reportsRouter.get('/', allowRoles(Perfil.ADMIN, Perfil.SINDICO), asyncHandler(async (req, res) => {
  const { mes = new Date().getMonth() + 1, ano = new Date().getFullYear() } = reportQuery.parse(req.query)
  const inicio = new Date(Date.UTC(ano, mes - 1, 1))
  const fim = new Date(Date.UTC(ano, mes, 1))
  const [total, porUnidade, itens] = await Promise.all([
    prisma.compra.aggregate({ where: { data: { gte: inicio, lt: fim } }, _sum: { valor: true }, _count: { _all: true } }),
    prisma.compra.groupBy({ by: ['unidadeId'], where: { data: { gte: inicio, lt: fim } }, _sum: { valor: true }, _count: { _all: true } }),
    prisma.compra.aggregate({ where: { data: { gte: inicio, lt: fim } }, _sum: { quantidade: true } }),
  ])
  const porUnidadeComVinculo = porUnidade.filter((row): row is typeof row & { unidadeId: string } => row.unidadeId !== null)
  const unidades = await prisma.unidade.findMany({ where: { id: { in: porUnidadeComVinculo.map((row) => row.unidadeId) } }, select: { id: true, numero: true, bloco: true } })
  const unidadesMap = new Map(unidades.map((unit) => [unit.id, unit]))
  await prisma.$transaction(porUnidadeComVinculo.map((row) => prisma.relatorioMensal.upsert({
    where: { unidadeId_ano_mes: { unidadeId: row.unidadeId, ano, mes } },
    create: { unidadeId: row.unidadeId, ano, mes, valorTotal: row._sum.valor ?? 0 },
    update: { valorTotal: row._sum.valor ?? 0 },
  })))

  return res.json({ mes, ano, valorTotal: total._sum.valor?.toNumber() ?? 0, totalCompras: total._count._all, totalItens: itens._sum.quantidade ?? 0, unidades: porUnidadeComVinculo.map((row) => ({ unidade: unidadesMap.get(row.unidadeId), valorTotal: row._sum.valor?.toNumber() ?? 0, totalCompras: row._count._all })) })
}))