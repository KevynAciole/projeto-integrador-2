const configuredApiUrl = import.meta.env.VITE_API_URL
export const API_URL = (import.meta.env.DEV ? configuredApiUrl || 'http://localhost:3000' : '').replace(/\/$/, '')

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? 'Não foi possível concluir a solicitação.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const money = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))

export type Product = { id: string; nome: string; categoria: string; quantidade: number; preco: number }
export type Purchase = {
  id: string
  data: string
  quantidade: number
  valor: number
  usuario: { id: string; nome: string }
  unidade: { id: string; numero: string; bloco?: string | null }
  item: { id: string; nome: string; categoria: string }
}