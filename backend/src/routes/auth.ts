import { Router } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { prisma } from '../lib/prisma'
import { asyncHandler } from '../lib/async-handler'

export const authRouter = Router()
let passportConfigured = false

export function configurePassport() {
  if (passportConfigured) return
  passportConfigured = true

  passport.serializeUser((user, done) => done(null, (user as Express.User).id))
  passport.deserializeUser((id: string, done) => {
    prisma.usuario.findUnique({ where: { id }, include: { unidade: true } })
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
      if (!user && (ADMIN_EMAILS ?? '').split(',').map((value) => value.trim().toLowerCase()).includes(email)) {
        user = await prisma.usuario.create({ data: { email, nome: profile.displayName, googleId: profile.id, perfil: 'GESTOR' } })
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
      return res.redirect(clientUrl)
    })
  })(req, res, next)
})

authRouter.get('/me', (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) return res.status(401).json({ error: 'Sessão não autenticada.' })
  const { id, nome, email, perfil, unidadeId } = req.user
  return res.json({ user: { id, nome, email, perfil: perfil.toLowerCase(), unidadeId } })
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