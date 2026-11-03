/// <reference types="jest" />

import express, { type NextFunction, type Request, type Response } from 'express'
import request from 'supertest'
import { Perfil } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { purchasesRouter, PurchaseError } from './purchases'

jest.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    itemEstoque: { findFirst: jest.fn(), updateMany: jest.fn() },
    compra: { create: jest.fn() },
    auditoria: { create: jest.fn() },
  },
}))

const app = express()
app.use(express.json())
app.use((req, _res, next) => {
  Object.assign(req, {
    user: {
      id: 'stock-manager-1',
      numeroUsuario: '123456',
      nome: 'Gestor de estoque',
      perfil: Perfil.ESTOQUISTA,
      unidadeId: null,
    },
  })
  next()
})
app.use('/compras', purchasesRouter)
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof PurchaseError) return res.status(error.status).json({ error: error.message })
  return res.status(500).json({ error: 'Erro interno do servidor.' })
})

describe('registro de compras', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.$transaction as jest.Mock).mockImplementation((callback: (transaction: typeof prisma) => Promise<unknown>) => callback(prisma))
    ;(prisma.itemEstoque.findFirst as jest.Mock).mockResolvedValue({
      id: 'item-1',
      preco: 5,
    })
    ;(prisma.itemEstoque.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
  })

  it('rejeita a compra quando a quantidade solicitada excede o estoque disponível', async () => {
    const response = await request(app)
      .post('/compras')
      .send({ itemId: 'item-1', quantidade: 3 })

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('Estoque insuficiente para esta quantidade.')
    expect(prisma.itemEstoque.updateMany).toHaveBeenCalledWith({
      where: { id: 'item-1', ativo: true, quantidade: { gte: 3 } },
      data: { quantidade: { decrement: 3 } },
    })
    expect(prisma.compra.create).not.toHaveBeenCalled()
    expect(prisma.auditoria.create).not.toHaveBeenCalled()
  })
})
