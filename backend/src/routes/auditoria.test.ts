/// <reference types="jest" />

import express from 'express'
import request from 'supertest'
import { Perfil } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { auditoriaRouter } from './auditoria'

jest.mock('../lib/prisma', () => ({
  prisma: {
    auditoria: { findMany: jest.fn() },
  },
}))

const app = express()
app.use((req, _res, next) => {
  Object.assign(req, { user: { id: 'admin-1', nome: 'Administradora', perfil: Perfil.ADMIN } })
  next()
})
app.use('/auditoria', auditoriaRouter)

describe('consulta de auditoria', () => {
  it('não expõe endereços IP na resposta da API', async () => {
    ;(prisma.auditoria.findMany as jest.Mock).mockResolvedValue([{
      id: 'event-1',
      acao: 'REGISTRAR_COMPRA',
      detalhes: 'Compra registrada.',
      usuarioId: 'user-1',
      usuarioNome: 'Pessoa Exemplo',
      ipAddress: '192.0.2.1',
      criadoEm: new Date('2026-11-02T12:00:00.000Z'),
    }])

    const response = await request(app).get('/auditoria')

    expect(response.status).toBe(200)
    expect(response.body[0]).not.toHaveProperty('ipAddress')
    expect(prisma.auditoria.findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: { id: true, acao: true, detalhes: true, usuarioId: true, usuarioNome: true, criadoEm: true },
    }))
  })
})
