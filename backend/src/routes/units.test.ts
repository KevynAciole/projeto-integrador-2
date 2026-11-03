/// <reference types="jest" />

import express from 'express'
import request from 'supertest'
import { Perfil, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { unitsRouter } from './units'

jest.mock('../lib/prisma', () => ({
  prisma: {
    unidade: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

let currentActor: { id: string; nome: string; perfil: Perfil; unidadeId: string | null } = { id: 'admin-1', nome: 'Administradora', perfil: Perfil.ADMIN, unidadeId: null }
const app = express()
app.use(express.json())
app.use((req, _res, next) => {
  Object.assign(req, { user: currentActor })
  next()
})
app.use('/unidades', unitsRouter)

describe('exclusão de unidades', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentActor = { id: 'admin-1', nome: 'Administradora', perfil: Perfil.ADMIN, unidadeId: null }
    ;(prisma.unidade.findUnique as jest.Mock).mockResolvedValue({
      id: 'unit-1',
      _count: { moradores: 0, compras: 0 },
    })
    ;(prisma.unidade.delete as jest.Mock).mockResolvedValue({})
  })

  it('exclui uma unidade sem moradores nem compras', async () => {
    const response = await request(app).delete('/unidades/unit-1')

    expect(response.status).toBe(204)
    expect(prisma.unidade.delete).toHaveBeenCalledWith({ where: { id: 'unit-1' } })
  })

  it.each([
    { moradores: 1, compras: 0 },
    { moradores: 0, compras: 1 },
  ])('impede a exclusão quando existem relações: $moradores morador(es), $compras compra(s)', async (counts) => {
    ;(prisma.unidade.findUnique as jest.Mock).mockResolvedValue({ id: 'unit-1', _count: counts })

    const response = await request(app).delete('/unidades/unit-1')

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('Não é possível excluir uma unidade com moradores ou compras vinculadas.')
    expect(prisma.unidade.delete).not.toHaveBeenCalled()
  })

  it('retorna não encontrado quando a unidade não existe', async () => {
    ;(prisma.unidade.findUnique as jest.Mock).mockResolvedValue(null)

    const response = await request(app).delete('/unidades/missing')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('Unidade não encontrada.')
    expect(prisma.unidade.delete).not.toHaveBeenCalled()
  })

  it('retorna moradores ativos e compras detalhadas somente da unidade do condômino', async () => {
    currentActor = { id: 'resident-1', nome: 'Moradora', perfil: Perfil.CONDOMINO, unidadeId: 'unit-1' }
    ;(prisma.unidade.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: 'unit-1',
      numero: '101',
      bloco: 'A',
      moradores: [{ id: 'resident-1', nome: 'Moradora' }],
      compras: [{
        id: 'purchase-1',
        data: new Date('2026-11-02T12:00:00.000Z'),
        quantidade: 2,
        valor: { toNumber: () => 10.5 },
        usuario: { nome: 'Moradora' },
        item: { nome: 'Arroz', categoria: 'Mercearia' },
      }],
    })

    const response = await request(app).get('/unidades/minha-unidade')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: 'unit-1',
      moradores: [{ id: 'resident-1', nome: 'Moradora' }],
      compras: [{ id: 'purchase-1', valor: 10.5, usuario: { nome: 'Moradora' }, item: { nome: 'Arroz' } }],
    })
    expect(prisma.unidade.findUniqueOrThrow).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'unit-1' },
      select: expect.objectContaining({
        moradores: expect.objectContaining({ where: { excluidoEm: null } }),
        compras: expect.objectContaining({ take: 200 }),
      }),
    }))
  })
})

describe('cadastro e edição de unidades', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentActor = { id: 'admin-1', nome: 'Administradora', perfil: Perfil.ADMIN, unidadeId: null }
  })

  it('permite cadastrar o mesmo número em um bloco diferente', async () => {
    ;(prisma.unidade.create as jest.Mock).mockResolvedValue({
      id: 'unit-b',
      numero: '101',
      bloco: 'B',
    })

    const response = await request(app)
      .post('/unidades')
      .send({ numero: '101', bloco: 'B' })

    expect(response.status).toBe(201)
    expect(prisma.unidade.create).toHaveBeenCalledWith({ data: { numero: '101', bloco: 'B' } })
  })

  it('retorna conflito ao cadastrar número já existente no mesmo bloco', async () => {
    ;(prisma.unidade.create as jest.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test' },
    ))

    const response = await request(app)
      .post('/unidades')
      .send({ numero: '101', bloco: 'A' })

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('Já existe uma unidade com este número neste bloco.')
  })

  it('retorna conflito ao editar a unidade para um número já usado no mesmo bloco', async () => {
    ;(prisma.unidade.update as jest.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test' },
    ))

    const response = await request(app)
      .patch('/unidades/unit-1')
      .send({ numero: '101', bloco: 'A' })

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('Já existe uma unidade com este número neste bloco.')
  })
})
