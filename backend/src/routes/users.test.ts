import express from 'express'
import request from 'supertest'
import { Perfil } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { usersRouter } from './users'

jest.mock('../lib/prisma', () => ({
  prisma: {
    usuario: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
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
app.use('/usuarios', usersRouter)

const targetUser = {
  id: 'user-1',
  nome: 'Usuário de teste',
  perfil: Perfil.CONDOMINO,
  excluidoEm: null,
}

describe('exclusão lógica de usuários', () => {
  const transaction = {
    usuario: { update: jest.fn() },
    auditoria: { create: jest.fn() },
  }

  beforeEach(() => {
    currentActor = admin
    jest.clearAllMocks()
    transaction.usuario.update.mockResolvedValue(targetUser)
    transaction.auditoria.create.mockResolvedValue({})
    ;(prisma.$transaction as jest.Mock).mockImplementation((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction))
    ;(prisma.usuario.findUnique as jest.Mock).mockResolvedValue(targetUser)
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
