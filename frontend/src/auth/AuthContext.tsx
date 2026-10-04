import { useEffect, useState } from 'react'
import { API_URL } from '../api'
import { AuthContext, type Role, type User } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.user) setUser(data.user) })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const enterDemo = (perfil: Role) => {
    const nomes: Record<Role, string> = { admin: 'Marina Costa', sindico: 'Rafael Almeida', estoquista: 'Lucas Martins', condomino: 'Camila Rocha', visitante: 'Visitante' }
    setDemo(true)
    setUser({ id: 'demo', numeroUsuario: '000001', nome: nomes[perfil], email: 'demo@mercadodopatio.com.br', perfil, unidadeId: perfil === 'condomino' ? 'unidade-demo' : null, deveTrocarSenha: false, senhaConfigurada: true })
  }

  const signIn = async (identificador: string, senha: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, senha }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'Não foi possível entrar.')
    setDemo(false)
    setUser(data.user)
    return data.user as User
  }

  const changePassword = async (senhaAtual: string, novaSenha: string) => {
    const response = await fetch(`${API_URL}/auth/alterar-senha`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'Não foi possível alterar a senha.')
    setUser(data.user)
  }

  const requestPasswordRecovery = async (identificador: string) => {
    const response = await fetch(`${API_URL}/auth/solicitar-recuperacao`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error ?? 'Não foi possível iniciar a recuperação.')
  }

  const resetPassword = async (token: string, novaSenha: string) => {
    const response = await fetch(`${API_URL}/auth/redefinir-senha`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, novaSenha }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error ?? 'Não foi possível redefinir a senha.')
  }

  const selfRegisterCondomino = async (data: { nome: string; email: string; telefone: string; unidadeId: string }) => {
    const response = await fetch(`${API_URL}/inscricao`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: data.nome, perfil: 'condomino', email: data.email, telefone: data.telefone, unidadeId: data.unidadeId }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.error ?? 'Não foi possível concluir o cadastro.')
  }

  const signOut = async () => {
    if (!demo) await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined)
    setUser(null)
    setDemo(false)
  }

  return <AuthContext.Provider value={{ user, loading, demo, enterDemo, signIn, changePassword, requestPasswordRecovery, resetPassword, selfRegisterCondomino, signOut }}>{children}</AuthContext.Provider>
}