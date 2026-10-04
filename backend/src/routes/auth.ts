import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { z } from 'zod'
import { normalizePhone, createUserNumber } from '../lib/accounts'
import { Perfil } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async-handler'
import { sendPasswordResetEmail } from '../lib/mail'
import { registrarAuditoria } from '../lib/auditoria'
import { requireAuth, type AuthUser } from '../middleware/auth'

export const authRouter = Router()
let passportConfigured = false

export function configurePassport() {
  if (passportConfigured) return
  passportConfigured = true

  passport.serializeUser((user, done) => done(null, (user as Express.User).id))
  passport.deserializeUser((id: string, done) => {
    prisma.usuario.findFirst({ where: { id, excluidoEm: null }, include: { unidade: true } })
      .then((user) => done(null, user ?? false))
      .catch((error: unknown) => done(error))
  })

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, ADMIN_EMAILS } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) return

  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    state: true,
    passReqToCallback: false,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase()
      if (!email) return done(null, false)

      let user = await prisma.usuario.findUnique({ where: { email } })
      if (user?.excluidoEm) return done(null, false)
      if (!user && (ADMIN_EMAILS ?? '').split(',').map((value) => value.trim().toLowerCase()).includes(email)) {
        user = await prisma.usuario.create({ data: { numeroUsuario: await createUserNumber(prisma), email, emailContato: email, nome: profile.displayName, googleId: profile.id, perfil: Perfil.ADMIN, deveTrocarSenha: true } })
      } else if (user && !user.googleId) {
        user = await prisma.usuario.update({ where: { id: user.id }, data: { googleId: profile.id } })
      }

      return done(null, user ?? false)
    } catch (error) {
      return done(error as Error)
    }
  }))
}

authRouter.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) return res.status(503).json({ error: 'Login Google não configurado.' })
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next)
})

authRouter.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (error: unknown, user: Express.User | false) => {
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173'
    if (error) return res.redirect(`${clientUrl}/login?erro=oauth`)
    if (!user) return res.redirect(`${clientUrl}/login?erro=nao-cadastrado`)
    req.logIn(user, (loginError) => {
      if (loginError) return next(loginError)
      return res.redirect(user.deveTrocarSenha ? `${clientUrl}/alterar-senha` : clientUrl)
    })
  })(req, res, next)
})

authRouter.post('/login', asyncHandler(async (req, res, next) => {
  const { identificador, senha } = z.object({ identificador: z.string().trim().min(1), senha: z.string().min(1) }).parse(req.body)
  const normalizedPhone = normalizePhone(identificador)
  const user = await prisma.usuario.findFirst({
    where: { OR: [{ numeroUsuario: identificador }, { telefone: normalizedPhone }], senhaHash: { not: null }, excluidoEm: null },
  })
  if (!user?.senhaHash || !await bcrypt.compare(senha, user.senhaHash)) return res.status(401).json({ error: 'Número/telefone ou senha inválidos.' })

  return req.logIn(user, (error) => {
    if (error) return next(error)
    return res.json({ user: toPublicUser(user) })
  })
}))

authRouter.post('/alterar-senha', requireAuth, asyncHandler(async (req, res) => {
  const { senhaAtual, novaSenha } = z.object({ senhaAtual: z.string().optional(), novaSenha: z.string().min(10).max(128) }).parse(req.body)
  const sessionUser = req.user as AuthUser
  const user = await prisma.usuario.findUniqueOrThrow({ where: { id: sessionUser.id } })
  if (user.senhaHash && (!senhaAtual || !await bcrypt.compare(senhaAtual, user.senhaHash))) {
    return res.status(400).json({ error: 'A senha temporária atual está incorreta.' })
  }
  const updated = await prisma.usuario.update({ where: { id: user.id }, data: { senhaHash: await bcrypt.hash(novaSenha, 12), deveTrocarSenha: false, resetToken: null, resetTokenExpiresAt: null } })
  req.user!.deveTrocarSenha = false
  await registrarAuditoria({ acao: 'ALTERAR_SENHA', detalhes: 'Senha alterada com sucesso.', usuarioId: user.id, usuarioNome: user.nome, ipAddress: req.ip ?? undefined })
  return res.json({ user: toPublicUser(updated) })
}))

authRouter.post('/solicitar-recuperacao', asyncHandler(async (req, res) => {
  const { identificador } = z.object({ identificador: z.string().trim().min(1) }).parse(req.body)
  const user = await prisma.usuario.findFirst({
    where: { OR: [{ numeroUsuario: identificador }, { emailContato: identificador.toLowerCase() }, { telefone: normalizePhone(identificador) }], excluidoEm: null },
  })
  if (!user) return res.status(404).json({ error: 'Nenhum usuário encontrado para esse identificador.' })
  const token = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15)
  await prisma.usuario.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpiresAt: expiresAt } })
  if (user.emailContato) {
    await sendPasswordResetEmail({ to: user.emailContato, nome: user.nome, numeroUsuario: user.numeroUsuario, token })
  }
  await registrarAuditoria({ acao: 'RECUPERAR_SENHA', detalhes: 'Solicitação de recuperação de senha registrada.', usuarioId: user.id, usuarioNome: user.nome, ipAddress: req.ip ?? undefined })
  return res.json({ message: 'Se os dados estiverem corretos, enviaremos instruções de recuperação.' })
}))

authRouter.post('/redefinir-senha', asyncHandler(async (req, res) => {
  const { token, novaSenha } = z.object({ token: z.string().trim().min(16), novaSenha: z.string().min(10).max(128) }).parse(req.body)
  const user = await prisma.usuario.findFirst({ where: { resetToken: token, resetTokenExpiresAt: { gt: new Date() }, excluidoEm: null } })
  if (!user) return res.status(400).json({ error: 'Token inválido ou expirado.' })
  await prisma.usuario.update({
    where: { id: user.id },
    data: { senhaHash: await bcrypt.hash(novaSenha, 12), deveTrocarSenha: false, resetToken: null, resetTokenExpiresAt: null },
  })
  await registrarAuditoria({ acao: 'REDEFINIR_SENHA', detalhes: 'Senha redefinida por recuperação.', usuarioId: user.id, usuarioNome: user.nome, ipAddress: req.ip ?? undefined })
  return res.json({ message: 'Senha redefinida com sucesso.' })
}))

authRouter.get('/me', (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) return res.status(401).json({ error: 'Sessão não autenticada.' })
  return res.json({ user: toPublicUser(req.user) })
})

authRouter.post('/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error)
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError)
      res.clearCookie('sid')
      return res.status(204).end()
    })
  })
})

function toPublicUser(user: Pick<AuthUser, 'id' | 'numeroUsuario' | 'nome' | 'email' | 'emailContato' | 'telefone' | 'perfil' | 'unidadeId' | 'deveTrocarSenha'> & { senhaHash?: string | null }) {
  return { id: user.id, numeroUsuario: user.numeroUsuario, nome: user.nome, email: user.email, emailContato: user.emailContato, telefone: user.telefone, perfil: user.perfil.toLowerCase(), unidadeId: user.unidadeId, deveTrocarSenha: user.deveTrocarSenha, senhaConfigurada: Boolean(user.senhaHash) }
}