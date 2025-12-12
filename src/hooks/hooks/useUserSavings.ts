// src/hooks/hooks/useUserSavings.ts
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'   // ✅ use your existing client

export type PlanType = 'flex' | 'fixed'
export type TokenChoice = 'USDC' | 'EURC'

export interface SavingDTO {
  id: string
  planType: PlanType
  tokenSymbol: TokenChoice
  createdAt: string
  maturesAt?: string | null
  chainId: number
  closed: boolean
}

async function fetchUserSavings(address: string): Promise<SavingDTO[]> {
  const res = await api.get('/api/savings/', {
    params: { address },
  })
  return res.data as SavingDTO[]
}

export function useUserSavings() {
  const { address } = useAccount()

  return useQuery({
    queryKey: ['user-savings', address],
    enabled: Boolean(address),
    queryFn: () => fetchUserSavings(address as string),
  })
}
