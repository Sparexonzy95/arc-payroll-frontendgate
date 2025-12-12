// src/hooks/useEmployers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createEmployer,
  fetchEmployers,
  type CreateEmployerPayload,
  type Employer,
} from '../api/employers'

const EMPLOYERS_KEY = ['employers']

/**
 * Fetch employers
 * - Fast fail (no long retries)
 * - Disabled until wallet is connected
 * - No refetch-on-focus lag
 */
export function useEmployers(enabled: boolean = true) {
  return useQuery({
    queryKey: EMPLOYERS_KEY,
    queryFn: fetchEmployers,
    enabled,

    retry: 1,
    retryDelay: 500,

    staleTime: 10_000,
    gcTime: 5 * 60_000,

    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

export function useCreateEmployer() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateEmployerPayload) => createEmployer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYERS_KEY })
    },
  })
}

export function findEmployerByWallet(
  employers: Employer[] | undefined,
  wallet: string | undefined
): Employer | undefined {
  if (!employers || !wallet) return undefined
  const lower = wallet.toLowerCase()
  return employers.find(
    (e) => e.wallet_address.toLowerCase() === lower
  )
}
