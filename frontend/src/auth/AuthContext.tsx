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
    const nomes: Record<Role, string> = { gestor: 'Marina Costa', sindico: 'Rafael Almeida', condomino: 'Camila Rocha' }
    setDemo(true)
    setUser({ id: 'demo', nome: nomes[perfil], email: 'demo@mercadodopatio.com.br', perfil, unidadeId: perfil === 'condomino' ? 'unidade-demo' : null })
  }

  const signOut = async () => {
    if (!demo) await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined)
    setUser(null)
    setDemo(false)
  }

  return <AuthContext.Provider value={{ user, loading, demo, enterDemo, signOut }}>{children}</AuthContext.Provider>
}