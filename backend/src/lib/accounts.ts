import { randomBytes, randomInt } from 'node:crypto'
import type { Prisma } from '@prisma/client'

export function createTemporaryPassword() {
  return randomBytes(9).toString('base64url')
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

export async function createUserNumber(database: Pick<Prisma.TransactionClient, 'usuario'>) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const numeroUsuario = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const exists = await database.usuario.findUnique({ where: { numeroUsuario }, select: { id: true } })
    if (!exists) return numeroUsuario
  }
  throw new Error('Não foi possível gerar um número de usuário exclusivo.')
}