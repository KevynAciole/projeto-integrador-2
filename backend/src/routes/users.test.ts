import express from 'express'
import request from 'supertest'
import { Perfil } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { usersRouter } from './users'

jest.mock('../lib/prisma', () => ({
  prisma: {
    usuario: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const admin = { id: 'admin-1', nome: 'Administradora', perfil: Perfil.ADMIN }
let currentActor: { id: string; nome: string; perfil: Perfil } = admin
const app = express()
app.use((req, _res, next) => {
  Object.assign(req, { user: currentActor })
  next()
})
app.use(express.json())
app.use('/usuarios', usersRouter)

const targetUser = {
  id: 'user-1',
  nome: 'Usuário de teste',
  perfil: Perfil.CONDOMINO,
  email: 'usuario@example.com',
  telefone: '5511999999999',
  unidadeId: null,
  excluidoEm: null,
}

describe('exclusão lógica de usuários', () => {
  const transaction = {
    usuario: { update: jest.fn() },
    compra: { updateMany: jest.fn() },
    auditoria: { create: jest.fn() },
  }

  beforeEach(() => {
    currentActor = admin
    jest.clearAllMocks()
    transaction.usuario.update.mockResolvedValue(targetUser)
    transaction.compra.updateMany.mockResolvedValue({ count: 0 })
    transaction.auditoria.create.mockResolvedValue({})
    ;(prisma.$transaction as jest.Mock).mockImplementation((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction))
    ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(targetUser)
    ;(prisma.usuario.findUniqueOrThrow as jest.Mock).mockResolvedValue(targetUser)
  })

  it('marca usuário como excluído e registra auditoria sem remover seus dados', async () => {
    const response = await request(app).delete('/usuarios/user-1')

    expect(response.status).toBe(204)
    expect(transaction.usuario.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { excluidoEm: expect.any(Date) },
    })
    expect(transaction.auditoria.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ acao: 'EXCLUIR_USUARIO', usuarioId: admin.id }),
    }))
  })

  it('impede que o administrador exclua a própria conta', async () => {
    const response = await request(app).delete(`/usuarios/${admin.id}`)

    expect(response.status).toBe(400)
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('impede que síndico exclua administrador', async () => {
    currentActor = { id: 'sindico-1', nome: 'Síndico', perfil: Perfil.SINDICO }
    ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ ...targetUser, perfil: Perfil.ADMIN })

    const response = await request(app).delete('/usuarios/user-1')

    expect(response.status).toBe(403)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('associa compras sem unidade quando o usuário é vinculado a uma unidade', async () => {
    const linkedUser = { ...targetUser, unidadeId: 'unit-1' }
    transaction.usuario.update.mockResolvedValue(linkedUser)

    const response = await request(app).patch('/usuarios/user-1').send({ unidadeId: 'unit-1' })

    expect(response.status).toBe(200)
    expect(transaction.usuario.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { unidade: { connect: { id: 'unit-1' } } },
    })
    expect(transaction.compra.updateMany).toHaveBeenCalledWith({
      where: { usuarioId: 'user-1', unidadeId: null },
      data: { unidadeId: 'unit-1' },
    })
  })

  it('não altera compras antigas ao trocar a unidade já vinculada', async () => {
    ;(prisma.usuario.findUniqueOrThrow as jest.Mock).mockResolvedValue({ ...targetUser, unidadeId: 'unit-old' })

    const response = await request(app).patch('/usuarios/user-1').send({ unidadeId: 'unit-new' })

    expect(response.status).toBe(200)
    expect(transaction.compra.updateMany).not.toHaveBeenCalled()
  })

  it('restaura usuário excluído e registra auditoria', async () => {
    ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ ...targetUser, excluidoEm: new Date() })

    const response = await request(app).post('/usuarios/user-1/restaurar')

    expect(response.status).toBe(204)
    expect(transaction.usuario.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { excluidoEm: null },
    })
    expect(transaction.auditoria.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ acao: 'RESTAURAR_USUARIO', usuarioId: admin.id }),
    }))
  })
})
