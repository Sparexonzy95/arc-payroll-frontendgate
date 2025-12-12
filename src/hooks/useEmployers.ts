import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createEmployer,
  fetchEmployers,
  type CreateEmployerPayload,
  type Employer
} from '../api/employers'

const EMPLOYERS_KEY = ['employers']

export function useEmployers() {
  const query = useQuery({
    queryKey: EMPLOYERS_KEY,
    queryFn: fetchEmployers
  })
  return query
}

export function useCreateEmployer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEmployerPayload) => createEmployer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYERS_KEY })
    }
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
