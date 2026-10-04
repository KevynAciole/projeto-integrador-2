import type { NextFunction, Request, Response } from 'express'
import { Perfil } from '@prisma/client'
import { allowRoles, requireAuth } from './auth'

function responseMocks() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as unknown as Response
  return res
}

describe('requireAuth', () => {
  it('retorna 401 sem sessão autenticada', () => {
    const req = { isAuthenticated: () => false, user: undefined } as unknown as Request
    const res = responseMocks()
    const next = jest.fn() as NextFunction

    requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('continua com sessão válida', () => {
    const req = { isAuthenticated: () => true, user: { id: 'u1' } } as unknown as Request
    const next = jest.fn() as NextFunction

    requireAuth(req, responseMocks(), next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})

describe('allowRoles', () => {
  it('permite o perfil autorizado', () => {
    const req = { user: { perfil: Perfil.ADMIN } } as unknown as Request
    const next = jest.fn() as NextFunction

    allowRoles(Perfil.ADMIN)(req, responseMocks(), next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('retorna 403 para perfil não autorizado', () => {
    const req = { user: { perfil: Perfil.CONDOMINO } } as unknown as Request
    const res = responseMocks()
    const next = jest.fn() as NextFunction

    allowRoles(Perfil.ADMIN)(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})