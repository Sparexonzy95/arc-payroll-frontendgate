// src/api/gateway.ts
import { api } from './client'

export interface GatewayBalance {
  domain: number
  depositor: string
  balance: string
}

export interface GatewayBalancesResponse {
  token: string
  balances: GatewayBalance[]
}

export interface GatewayBalanceRequest {
  employer_id: number
  token: string
}

/**
 * Shape of a single burn request for Circle /v1/transfer:
 * { burnIntent: { ... }, signature: "0x..." }
 */
export interface GatewayBurnRequest {
  burnIntent: any
  signature: string
}

/**
 * New transfer request payload:
 * - employer_id and token are for your Django backend
 * - burn_requests is the array that will be forwarded to Circle Gateway
 */
export interface GatewayTransferRequest {
  employer_id: number
  token: string
  burn_requests: GatewayBurnRequest[]
}

export interface GatewayTransfer {
  id?: number
  employer?: number
  from_domain?: number
  to_domain?: number
  amount?: string
  token: string
  status: string
  raw_response?: unknown
  created_at?: string
}

export async function fetchGatewayBalances(
  payload: GatewayBalanceRequest
): Promise<GatewayBalancesResponse> {
  const res = await api.post<GatewayBalancesResponse>(
    '/api/gateway/balances/',
    payload
  )
  return res.data
}

/**
 * Create a Gateway transfer attestation via Django.
 *
 * NOTE: burnIntent contains BigInt fields, so we must JSON-serialize with
 * a replacer that converts BigInt -> string, otherwise axios/JSON will blow up.
 */
export async function createGatewayTransfer(
  payload: GatewayTransferRequest
): Promise<GatewayTransfer> {
  const safePayload = JSON.parse(
    JSON.stringify(payload, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  )

  const res = await api.post<GatewayTransfer>('/api/gateway/transfer/', safePayload)
  return res.data
}
