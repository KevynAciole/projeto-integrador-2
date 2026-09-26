import { createApp, prisma } from './app'

const port = Number(process.env.PORT ?? 3000)
const app = createApp()
const server = app.listen(port, () => console.log(`API disponível em http://localhost:${port}`))

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => { void prisma.$disconnect().finally(() => process.exit(0)) })
  })
}