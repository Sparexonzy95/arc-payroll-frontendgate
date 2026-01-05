import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createAgreement,
  listEscrows,
  getEscrow,
  createMessage,
  listMessages,
  createEvidence,
  listEvidence,
  createDispute,
} from './escrow.api'

export function useEscrows(wallet?: string) {
  const w = wallet?.toLowerCase() ?? ''
  return useQuery({
    queryKey: ['escrows', w || 'all'],
    queryFn: () => listEscrows(w || undefined),
    enabled: true,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  })
}

export function useEscrow(pk?: number) {
  return useQuery({
    queryKey: ['escrow', pk ?? 0],
    queryFn: () => getEscrow(pk as number),
    enabled: !!pk,
    staleTime: 5_000,
  })
}

export function useAgreementCreate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAgreement,
    onSuccess: () => {
      // refresh any escrow views that depend on agreement hash
      qc.invalidateQueries({ queryKey: ['escrow'], exact: false })
      qc.invalidateQueries({ queryKey: ['escrows'], exact: false })
    },
  })
}

export function useMessages(escrowPk?: number) {
  return useQuery({
    queryKey: ['escrow-messages', escrowPk ?? 0],
    queryFn: () => listMessages(escrowPk as number),
    enabled: !!escrowPk,
    staleTime: 2_000,
  })
}

export function useCreateMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMessage,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['escrow-messages', vars.escrow] })
    },
  })
}

export function useEvidence(escrowPk?: number) {
  return useQuery({
    queryKey: ['escrow-evidence', escrowPk ?? 0],
    queryFn: () => listEvidence(escrowPk as number),
    enabled: !!escrowPk,
    staleTime: 5_000,
  })
}

export function useCreateEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEvidence,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['escrow-evidence', vars.escrow] })
    },
  })
}

export function useCreateDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createDispute,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['escrow', vars.escrow], exact: false })
      // IMPORTANT: invalidate ALL wallet variants: ['escrows', wallet]
      qc.invalidateQueries({ queryKey: ['escrows'], exact: false })
    },
  })
}

export function useInvalidateEscrowQueries() {
  const qc = useQueryClient()
  return () => {
    // IMPORTANT: exact:false so it refreshes wallet-scoped keys too
    qc.invalidateQueries({ queryKey: ['escrows'], exact: false })
    qc.invalidateQueries({ queryKey: ['escrow'], exact: false })
    qc.invalidateQueries({ queryKey: ['escrow-evidence'], exact: false })
    qc.invalidateQueries({ queryKey: ['escrow-messages'], exact: false })
  }
}
