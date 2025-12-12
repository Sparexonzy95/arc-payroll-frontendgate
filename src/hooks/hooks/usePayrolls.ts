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

/**
 * Payroll list – lighter data, can poll a bit slower.
 */
export function usePayrolls() {
  return useQuery<PayrollDTO[]>({
    queryKey: ['payrolls'],
    queryFn: fetchPayrolls,
    // dashboard list, moderate polling
    refetchInterval: 5000,          // 5s
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
    // detail view, a bit faster
    refetchInterval: 3000,          // 3s
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
    // tight polling so "Funded (atomic)" updates quickly
    refetchInterval: 2000,          // 2s
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
    refetchInterval: 3000,          // 3s
    refetchOnWindowFocus: true,
  })
}

export function useCreatePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePayrollPayload) => createPayroll(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })
}

export function useCreatePayrollOnchain() {
  return useMutation({
    mutationFn: (id: number) => createPayrollOnchain(id),
  })
}
