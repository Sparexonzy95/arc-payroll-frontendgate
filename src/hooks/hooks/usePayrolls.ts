// src/hooks/usePayrolls.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createPayroll,
  fetchPayroll,
  fetchPayrolls,
  fetchPayrollFunding,
  fetchPayrollPayments,
  createPayrollOnchain,
  type CreatePayrollPayload,
  type PayrollDTO,
  type FundingResponse,
  type PaymentDTO,
} from '../../api/payrolls'

function invalidatePayroll(qc: ReturnType<typeof useQueryClient>, id?: number) {
  // refresh list always
  qc.invalidateQueries({ queryKey: ['payrolls'] })

  // refresh this payroll + its children
  if (typeof id === 'number') {
    qc.invalidateQueries({ queryKey: ['payrolls', id], exact: false })
  }
}

/**
 * Payroll list – lighter data, can poll a bit slower.
 */
export function usePayrolls() {
  return useQuery<PayrollDTO[]>({
    queryKey: ['payrolls'],
    queryFn: fetchPayrolls,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Single payroll – core detail, keep this quite fresh.
 */
export function usePayroll(id?: number) {
  return useQuery<PayrollDTO>({
    queryKey: ['payrolls', id],
    queryFn: () => fetchPayroll(id as number),
    enabled: typeof id === 'number',
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Funding summary – needs to track funding events quickly.
 */
export function usePayrollFunding(id?: number) {
  return useQuery<FundingResponse>({
    queryKey: ['payrolls', id, 'funding'],
    queryFn: () => fetchPayrollFunding(id as number),
    enabled: typeof id === 'number',
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Payments – poll so dispatch status / tx update fast.
 */
export function usePayrollPayments(id?: number) {
  return useQuery<PaymentDTO[]>({
    queryKey: ['payrolls', id, 'payments'],
    queryFn: () => fetchPayrollPayments(id as number),
    enabled: typeof id === 'number',
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  })
}

export function useCreatePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePayrollPayload) => createPayroll(payload),
    onSuccess: () => {
      invalidatePayroll(qc)
    },
  })
}

export function useCreatePayrollOnchain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => createPayrollOnchain(id),
    onSuccess: (_data, id) => {
      invalidatePayroll(qc, id)
    },
  })
}
