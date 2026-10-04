import nodemailer from 'nodemailer'

export class NotificationError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}

function logMailFailure(operation: string, error: unknown) {
  const details = typeof error === 'object' && error !== null
    ? error as Record<string, unknown>
    : {}

  console.error(`Falha SMTP ao ${operation}.`, {
    name: error instanceof Error ? error.name : 'UnknownError',
    ...(typeof details.code === 'string' ? { code: details.code } : {}),
    ...(typeof details.command === 'string' ? { command: details.command } : {}),
    ...(typeof details.responseCode === 'number' ? { responseCode: details.responseCode } : {}),
  })
}

export async function sendTemporaryCredentials(input: { to: string; nome: string; numeroUsuario: string; senhaTemporaria: string }) {
  const host = process.env.SMTP_HOST
  const from = process.env.SMTP_FROM
  if (!host || !from) throw new NotificationError(503, 'O envio de e-mail não está configurado.')

  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  })

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: 'Acesso ao minimercado do condomínio',
      text: [
        `Olá, ${input.nome}.`,
        '',
        'Seu cadastro no minimercado foi criado.',
        `Número de usuário: ${input.numeroUsuario}`,
        `Senha temporária: ${input.senhaTemporaria}`,
        '',
        'Entre com o número de usuário ou telefone e esta senha. No primeiro acesso será solicitado que você crie uma senha nova.',
      ].join('\n'),
    })
  } catch (error) {
    logMailFailure('enviar credenciais', error)
    throw new NotificationError(502, 'Não foi possível enviar as credenciais por e-mail.')
  }
}

export async function sendPasswordResetEmail(input: { to: string; nome: string; numeroUsuario: string; token: string }) {
  const host = process.env.SMTP_HOST
  const from = process.env.SMTP_FROM
  if (!host || !from) throw new NotificationError(503, 'O envio de e-mail não está configurado.')

  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  })

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: 'Redefinição de senha do minimercado',
      text: [
        `Olá, ${input.nome}.`,
        '',
        'Recebemos uma solicitação para redefinir sua senha.',
        `Número de usuário: ${input.numeroUsuario}`,
        `Token de recuperação: ${input.token}`,
        '',
        'Use esse token na rota de redefinição de senha para criar uma nova senha e trocar a senha temporária.',
      ].join('\n'),
    })
  } catch (error) {
    logMailFailure('enviar recuperação de senha', error)
    throw new NotificationError(502, 'Não foi possível enviar o e-mail de recuperação.')
  }
}