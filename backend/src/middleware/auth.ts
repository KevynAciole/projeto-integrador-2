import type { NextFunction, Request, Response } from 'express'
import type { Perfil, Usuario } from '@prisma/client'

export type AuthUser = Pick<Usuario, 'id' | 'numeroUsuario' | 'googleId' | 'email' | 'emailContato' | 'telefone' | 'nome' | 'perfil' | 'unidadeId' | 'deveTrocarSenha'>

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

export function requirePasswordUpdated(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthUser | undefined
  if (user?.deveTrocarSenha) return res.status(403).json({ code: 'PASSWORD_CHANGE_REQUIRED', error: 'Troque a senha temporária antes de continuar.' })
  return next()
}