import type { NextFunction, Request, Response } from 'express'
import type { Perfil, Usuario } from '@prisma/client'

export type AuthUser = Pick<Usuario, 'id' | 'email' | 'nome' | 'perfil' | 'unidadeId'>

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' })
  }
  return next()
}

export function allowRoles(...roles: Perfil[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined
    if (!user || !roles.includes(user.perfil)) {
      return res.status(403).json({ error: 'Seu perfil não permite esta operação.' })
    }
    return next()
  }
}