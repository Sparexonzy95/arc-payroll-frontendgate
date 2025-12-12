// src/hooks/useGateway.ts
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  fetchGatewayBalances,
  createGatewayTransfer,
  type GatewayBalanceRequest,
  type GatewayBalancesResponse,
  type GatewayTransferRequest,
  type GatewayTransfer
} from '../../api/gateway'

export function useGatewayBalances(req: GatewayBalanceRequest | undefined) {
  return useQuery<GatewayBalancesResponse>({
    queryKey: ['gateway', 'balances', req],
    queryFn: () => fetchGatewayBalances(req!),
    enabled: !!req
  })
}

/**
 * useGatewayTransfer now expects a payload with:
 * {
 *   employer_id,
 *   token: "USDC",
 *   burn_requests: [ { burnIntent, signature }, ... ]
 * }
 */
export function useGatewayTransfer() {
  return useMutation<GatewayTransfer, unknown, GatewayTransferRequest>({
    mutationFn: (payload) => createGatewayTransfer(payload)
  })
}
