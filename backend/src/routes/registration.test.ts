import express from 'express'
import request from 'supertest'
import { ZodError } from 'zod'
import { prisma } from '../lib/prisma'
import { sendTemporaryCredentials } from '../lib/mail'
import { registrationRouter } from './registration'

jest.mock('../lib/prisma', () => ({
  prisma: {
    unidade: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('../lib/mail', () => ({
  sendTemporaryCredentials: jest.fn(),
  NotificationError: class NotificationError extends Error {
    constructor(public readonly status: number, message: string) { super(message) }
  },
}))

const app = express()
app.use(express.json())
app.use('/inscricao', registrationRouter)
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ error: 'Dados inválidos.' })
  return res.status(500).json({ error: 'Erro interno do servidor.' })
})
const createUser = jest.fn()

describe('autoinscrição pública', () => {
  const createdUser = {
    id: 'user-1',
    numeroUsuario: '123456',
    email: 'pessoa@example.com',
    emailContato: 'pessoa@example.com',
    telefone: '5511999999999',
    nome: 'Pessoa Exemplo',
    perfil: 'CONDOMINO',
    unidadeId: 'unit-1',
    deveTrocarSenha: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    createUser.mockResolvedValue(createdUser)
    ;(prisma.unidade.findMany as jest.Mock).mockResolvedValue([{ id: 'unit-1', numero: '101', bloco: 'A' }])
    ;(prisma.$transaction as jest.Mock).mockImplementation((callback: (transaction: object) => Promise<unknown>) => callback({
      usuario: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: createUser,
      },
    }))
    ;(sendTemporaryCredentials as jest.Mock).mockResolvedValue(undefined)
  })

  it('publica somente os dados necessários para escolher uma unidade', async () => {
    const response = await request(app).get('/inscricao/unidades')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([{ id: 'unit-1', numero: '101', bloco: 'A' }])
    expect(prisma.unidade.findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: { id: true, numero: true, bloco: true },
    }))
  })

  it('permite solicitar cadastro público e envia credenciais', async () => {
    const response = await request(app).post('/inscricao').send({
      nome: 'Pessoa Exemplo',
      email: 'pessoa@example.com',
      telefone: '(11) 99999-9999',
      unidadeId: 'unit-1',
    })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ id: 'user-1', unidadeId: 'unit-1', notificacaoEnviada: true })
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: 'pessoa@example.com', emailContato: 'pessoa@example.com' }),
    }))
    expect(sendTemporaryCredentials).toHaveBeenCalledWith(expect.objectContaining({
      to: 'pessoa@example.com',
      nome: 'Pessoa Exemplo',
      numeroUsuario: '123456',
      senhaTemporaria: expect.any(String),
    }))
  })

  it.each([12, 15, 16])('rejeita telefone de %i dígitos sem criar usuário ou enviar credenciais', async (length) => {
    const response = await request(app).post('/inscricao').send({
      nome: 'Pessoa Exemplo',
      email: 'pessoa@example.com',
      telefone: '1'.repeat(length),
      unidadeId: 'unit-1',
    })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Dados inválidos.')
    expect(createUser).not.toHaveBeenCalled()
    expect(sendTemporaryCredentials).not.toHaveBeenCalled()
  })
})
