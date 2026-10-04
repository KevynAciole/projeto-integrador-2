import { createContext } from 'react'

export type Role = 'admin' | 'sindico' | 'estoquista' | 'condomino' | 'visitante'
export type User = { id: string; numeroUsuario: string; nome: string; email?: string | null; telefone?: string | null; perfil: Role; unidadeId?: string | null; deveTrocarSenha: boolean; senhaConfigurada: boolean }
export type AuthContextValue = {
  user: User | null
  loading: boolean
  demo: boolean
  enterDemo: (role: Role) => void
  signIn: (identificador: string, senha: string) => Promise<User>
  changePassword: (senhaAtual: string, novaSenha: string) => Promise<void>
  requestPasswordRecovery: (identificador: string) => Promise<void>
  resetPassword: (token: string, novaSenha: string) => Promise<void>
  selfRegisterCondomino: (data: { nome: string; email: string; telefone: string; unidadeId: string }) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)