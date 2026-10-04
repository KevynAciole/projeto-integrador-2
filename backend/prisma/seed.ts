import dotenv from 'dotenv'
import { Perfil, PrismaClient } from '@prisma/client'
import { createUserNumber } from '../src/lib/accounts'

dotenv.config()
dotenv.config({ path: '../.env' })

const prisma = new PrismaClient()

async function main() {
  const emails = (process.env.ADMIN_EMAILS ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)
  if (emails.length === 0) throw new Error('Defina ao menos um ADMIN_EMAILS antes de executar o seed.')

  for (const email of emails) {
    await prisma.usuario.upsert({
      where: { email },
      update: { perfil: Perfil.ADMIN, emailContato: email },
      create: { numeroUsuario: await createUserNumber(prisma), email, emailContato: email, nome: email.split('@')[0].replace(/[._-]/g, ' '), perfil: Perfil.ADMIN, deveTrocarSenha: true },
    })
  }
  console.log(`${emails.length} administrador(es) inicial(is) configurado(s).`)
}

main().finally(() => prisma.$disconnect())