import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async-handler'
import { allowRoles } from '../middleware/auth'
import { Perfil } from '@prisma/client'

export const auditoriaSchema = z.object({
  acao: z.string().min(1).optional(),
  detalhes: z.string().optional(),
  usuarioId: z.string().optional(),
  usuarioNome: z.string().optional(),
  ipAddress: z.string().optional(),
})

const querySchema = z.object({
  acao: z.string().trim().optional(),
  usuario: z.string().trim().optional(),
  dataInicio: z.string().trim().optional(),
  dataFim: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
})

export const auditoriaRouter = Router()

auditoriaRouter.get('/', allowRoles(Perfil.ADMIN), asyncHandler(async (req, res) => {
  const { acao, usuario, dataInicio, dataFim, limit } = querySchema.parse(req.query)
  const where = {
    ...(acao ? { acao: { contains: acao, mode: 'insensitive' as const } } : {}),
    ...(usuario ? {
      OR: [
        { usuarioNome: { contains: usuario, mode: 'insensitive' as const } },
        { usuarioId: { contains: usuario } },
      ],
    } : {}),
    ...(dataInicio || dataFim ? {
      criadoEm: {
        ...(dataInicio ? { gte: new Date(dataInicio) } : {}),
        ...(dataFim ? { lte: new Date(`${dataFim}T23:59:59.999Z`) } : {}),
      },
    } : {}),
  }

  const registros = await prisma.auditoria.findMany({ where, orderBy: { criadoEm: 'desc' }, take: limit })
  return res.json(registros)
}))

auditoriaRouter.get('/resumo', allowRoles(Perfil.ADMIN), asyncHandler(async (_req, res) => {
  const total = await prisma.auditoria.count()
  const ultimas24h = await prisma.auditoria.count({ where: { criadoEm: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
  const usuariosDistintos = await prisma.auditoria.groupBy({ by: ['usuarioId'], where: { usuarioId: { not: null } } })
  return res.json({ total, ultimas24h, usuariosDistintos: usuariosDistintos.length })
}))
