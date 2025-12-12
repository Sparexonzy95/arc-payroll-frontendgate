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
  type PaymentDTO
} from '../../api/payrolls'

export function usePayrolls() {
  return useQuery<PayrollDTO[]>({
    queryKey: ['payrolls'],
    queryFn: fetchPayrolls,
    refetchInterval: 10000 // Refetch every 10 seconds to see updates
  })
}

export function usePayroll(id?: number) {
  return useQuery<PayrollDTO>({
    queryKey: ['payrolls', id],
    queryFn: () => fetchPayroll(id as number),
    enabled: typeof id === 'number',
    refetchInterval: 5000 // Refetch every 5 seconds
  })
}

export function usePayrollFunding(id?: number) {
  return useQuery<FundingResponse>({
    queryKey: ['payrolls', id, 'funding'],
    queryFn: () => fetchPayrollFunding(id as number),
    enabled: typeof id === 'number',
    refetchInterval: 5000 // Refetch to see funding updates
  })
}

export function usePayrollPayments(id?: number) {
  return useQuery<PaymentDTO[]>({
    queryKey: ['payrolls', id, 'payments'],
    queryFn: () => fetchPayrollPayments(id as number),
    enabled: typeof id === 'number'
  })
}

export function useCreatePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePayrollPayload) => createPayroll(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payrolls'] })
    }
  })
}

export function useCreatePayrollOnchain() {
  return useMutation({
    mutationFn: (id: number) => createPayrollOnchain(id)
  })
}