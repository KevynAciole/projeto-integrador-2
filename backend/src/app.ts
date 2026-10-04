import dotenv from 'dotenv'
import express, { type NextFunction, type Request, type Response } from 'express'
import session from 'express-session'
import passport from 'passport'
import cors from 'cors'
import connectPgSimple from 'connect-pg-simple'
import { Pool } from 'pg'
import swaggerUi from 'swagger-ui-express'
import { ZodError } from 'zod'
import { openApiDocument } from './openapi'
import { prisma } from './lib/prisma'
import { NotificationError } from './lib/mail'
import { requireAuth, requirePasswordUpdated } from './middleware/auth'
import { authRouter, configurePassport } from './routes/auth'
import { registrationRouter } from './routes/registration'
import { productsRouter } from './routes/products'
import { usersRouter } from './routes/users'
import { unitsRouter } from './routes/units'
import { purchasesRouter, PurchaseError } from './routes/purchases'
import { reportsRouter } from './routes/reports'
import { auditoriaRouter } from './routes/auditoria'

dotenv.config()
dotenv.config({ path: '../.env' })

const PgStore = connectPgSimple(session)
const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret && process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET precisa estar configurado em produção.')

export function createApp() {
  configurePassport()
  const app = express()
  app.set('trust proxy', 1)

  const allowedOrigins = (process.env.CORS_ORIGIN ?? process.env.CLIENT_URL ?? 'http://localhost:5173')
    .split(',').map((origin) => origin.trim()).filter(Boolean)
  app.use(cors({ origin: allowedOrigins, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(session({
    name: 'sid',
    secret: sessionSecret ?? 'development-only-change-this-secret',
    resave: false,
    saveUninitialized: false,
    ...(process.env.NODE_ENV === 'production' && process.env.DATABASE_URL
      ? { store: new PgStore({ pool: new Pool({ connectionString: process.env.DATABASE_URL }), createTableIfMissing: true }) }
      : {}),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    },
  }))
  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))
  app.get('/api/openapi.json', (_req, res) => res.json(openApiDocument))
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }))
  app.use('/auth', authRouter)
  app.use('/inscricao', registrationRouter)
  app.use('/estoque', requireAuth, requirePasswordUpdated, productsRouter)
  app.use('/usuarios', requireAuth, requirePasswordUpdated, usersRouter)
  app.use('/unidades', requireAuth, requirePasswordUpdated, unitsRouter)
  app.use('/compras', requireAuth, requirePasswordUpdated, purchasesRouter)
  app.use('/relatorios', requireAuth, requirePasswordUpdated, reportsRouter)
  app.use('/auditoria', requireAuth, requirePasswordUpdated, auditoriaRouter)

  app.use((_req, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }))
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ZodError) return res.status(400).json({ error: 'Dados inválidos.', details: error.issues })
    if (error instanceof PurchaseError) return res.status(error.status).json({ error: error.message })
    if (error instanceof NotificationError) return res.status(error.status).json({ error: error.message })
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: string }).code
      if (code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado.' })
      if (code === 'P2002') return res.status(409).json({ error: 'Já existe um registro com estes dados.' })
      if (code === 'P2003') return res.status(400).json({ error: 'Referência inválida.' })
    }
    console.error(error)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  })

  return app
}

export { prisma }