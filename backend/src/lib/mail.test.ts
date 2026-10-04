import { NotificationError, sendPasswordResetEmail, sendTemporaryCredentials } from './mail'

describe('envio de e-mail pela API Resend', () => {
  const originalApiKey = process.env.RESEND_API_KEY
  const originalFrom = process.env.RESEND_FROM
  const fetchMock = jest.spyOn(global, 'fetch')

  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.RESEND_FROM = 'Minimercado <noreply@example.com>'
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
  })

  afterEach(() => {
    fetchMock.mockReset()
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = originalApiKey
    if (originalFrom === undefined) delete process.env.RESEND_FROM
    else process.env.RESEND_FROM = originalFrom
  })

  afterAll(() => fetchMock.mockRestore())

  it('envia credenciais temporárias para a API Resend', async () => {
    await sendTemporaryCredentials({
      to: 'pessoa@example.com',
      nome: 'Pessoa',
      numeroUsuario: '123456',
      senhaTemporaria: 'senha-temporaria',
    })

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: {
        Authorization: 'Bearer re_test_key',
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
    }))
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(requestBody).toMatchObject({
      from: 'Minimercado <noreply@example.com>',
      to: 'pessoa@example.com',
      subject: 'Acesso ao minimercado do condomínio',
    })
    expect(requestBody.text).toContain('Número de usuário: 123456')
    expect(requestBody.text).toContain('Senha temporária: senha-temporaria')
  })

  it('envia instruções de recuperação para a API Resend', async () => {
    await sendPasswordResetEmail({
      to: 'pessoa@example.com',
      nome: 'Pessoa',
      numeroUsuario: '123456',
      token: 'token-de-recuperacao',
    })

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    expect(requestBody.subject).toBe('Redefinição de senha do minimercado')
    expect(requestBody.text).toContain('Token de recuperação: token-de-recuperacao')
  })

  it('retorna erro explícito quando a API não está configurada', async () => {
    delete process.env.RESEND_API_KEY

    await expect(sendTemporaryCredentials({
      to: 'pessoa@example.com',
      nome: 'Pessoa',
      numeroUsuario: '123456',
      senhaTemporaria: 'senha-temporaria',
    })).rejects.toEqual(expect.objectContaining({ status: 503 }))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retorna erro explícito quando o Resend rejeita a solicitação', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))

    await expect(sendTemporaryCredentials({
      to: 'pessoa@example.com',
      nome: 'Pessoa',
      numeroUsuario: '123456',
      senhaTemporaria: 'senha-temporaria',
    })).rejects.toBeInstanceOf(NotificationError)
  })
})
