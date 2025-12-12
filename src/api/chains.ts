import { api } from './client'

export interface ChainDTO {
  id: number
  name: string
  chain_id: number
  payroll_manager_address: string

  // NEW: optional, because not all chains must have a vault
  savings_vault_address?: string | null
}

export interface TokenDTO {
  id: number
  chain: number
  symbol: string
  address: string
  decimals: number
  is_supported: boolean
}

export async function fetchChains(): Promise<ChainDTO[]> {
  const res = await api.get<ChainDTO[]>('/api/chains/chains/')
  return res.data
}

export async function fetchTokens(): Promise<TokenDTO[]> {
  const res = await api.get<TokenDTO[]>('/api/chains/tokens/')
  return res.data
}
