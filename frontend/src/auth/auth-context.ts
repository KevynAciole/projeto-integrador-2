import { createContext } from 'react'

export type Role = 'gestor' | 'sindico' | 'condomino'
export type User = { id: string; nome: string; email: string; perfil: Role; unidadeId?: string | null }
export type AuthContextValue = { user: User | null; loading: boolean; demo: boolean; enterDemo: (role: Role) => void; signOut: () => Promise<void> }

export const AuthContext = createContext<AuthContextValue | null>(null)