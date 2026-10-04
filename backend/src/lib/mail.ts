export class NotificationError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}

async function sendTransactionalEmail(input: { to: string; subject: string; text: string }, operation: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) throw new NotificationError(503, 'O envio de e-mail não está configurado.')

  let response: Response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text }),
      signal: AbortSignal.timeout(10000),
    })
  } catch (error) {
    console.error(`Falha na API Resend ao ${operation}.`, {
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    throw new NotificationError(502, 'Não foi possível enviar o e-mail.')
  }

  if (!response.ok) {
    console.error(`Falha na API Resend ao ${operation}.`, { status: response.status })
    throw new NotificationError(502, 'Não foi possível enviar o e-mail.')
  }
}

export async function sendTemporaryCredentials(input: { to: string; nome: string; numeroUsuario: string; senhaTemporaria: string }) {
  await sendTransactionalEmail({
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
  }, 'enviar credenciais')
}

export async function sendPasswordResetEmail(input: { to: string; nome: string; numeroUsuario: string; token: string }) {
  await sendTransactionalEmail({
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
  }, 'enviar recuperação de senha')
}
