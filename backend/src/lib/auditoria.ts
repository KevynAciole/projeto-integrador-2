import { prisma } from './prisma'

export async function registrarAuditoria(input: {
  acao: string
  detalhes?: string
  usuarioId?: string
  usuarioNome?: string
  ipAddress?: string
}) {
  return prisma.auditoria.create({
    data: {
      acao: input.acao,
      detalhes: input.detalhes ?? null,
      usuarioId: input.usuarioId ?? null,
      usuarioNome: input.usuarioNome ?? null,
      ipAddress: input.ipAddress ?? null,
    },
  })
}
