// src/api/payrolls.ts
import { api } from './client'

export type ScheduleType = 'instant' | 'daily' | 'monthly' | 'yearly'

export interface SchedulePayload {
  type: ScheduleType
  start_at: string
  end_at?: string | null
  time_of_day_seconds?: number | null
  day_of_month?: number | null
}

export interface PaymentPayload {
  employee_address: string
  token_address?: string
  net_human: string
  tax_human: string
  encrypted_ref: string
}

export interface CreatePayrollPayload {
  employer: number
  source_chain: number
  title: string
  description: string
  default_token_address: string
  schedule?: SchedulePayload | null
  payroll_id?: number
  payments: PaymentPayload[]
}

export type PayrollStatus =
  | 'draft'
  | 'created_onchain'
  | 'funding_pending'
  | 'active'
  | 'completed'
  | 'failed'

export interface PayrollDTO {
  id: number
  employer: number
  source_chain: number
  payroll_id: number
  title: string
  description: string
  metadata_hash: string
  payments_root: string
  total_payments: number
  default_token_address: string
  total_net_amount: string
  total_tax_amount: string
  schedule: SchedulePayload | null
  status: PayrollStatus
  created_tx_hash: string | null
  created_block_number: number | null
  finalized_onchain: boolean
  finalized_tx_hash: string | null
  created_at: string
  updated_at: string
}

export type PaymentStatus = 'pending' | 'claimable' | 'dispatched' | 'failed'

export interface PaymentDTO {
  id: number
  payroll: number
  payroll_index: number
  employee_address: string
  token_address: string
  net_amount_atomic: string
  tax_amount_atomic: string
  encrypted_ref: string
  merkle_leaf: string
  merkle_proof: string[]
  status: PaymentStatus
  release_at: string | null
  dispatched_tx_hash: string | null
  last_error: string | null
  created_at: string
}

export interface PayrollFundingDTO {
  id: number
  token: number
  token_symbol: string
  amount: string
  funder_address: string
  tx_hash: string
  block_number: number
  created_at: string
}

export interface FundingSummaryItem {
  token_address: string
  required: string
  funded: string
  deficit: string
}

export interface FundingResponse {
  funding_events: PayrollFundingDTO[]
  summary: FundingSummaryItem[]
}

export interface CreateOnchainResponse {
  to: string
  data: string
  chainId: number
}

const BASE_PATH = '/api/payrolls'

export async function fetchPayrolls(): Promise<PayrollDTO[]> {
  const res = await api.get<PayrollDTO[]>(`${BASE_PATH}/payrolls/`)
  return res.data
}

export async function fetchPayroll(id: number): Promise<PayrollDTO> {
  const res = await api.get<PayrollDTO>(`${BASE_PATH}/payrolls/${id}/`)
  return res.data
}

export async function fetchPayrollFunding(id: number): Promise<FundingResponse> {
  const res = await api.get<FundingResponse>(
    `${BASE_PATH}/payrolls/${id}/funding/`
  )
  return res.data
}

export async function fetchPayrollPayments(id: number): Promise<PaymentDTO[]> {
  const res = await api.get<PaymentDTO[]>(`${BASE_PATH}/payrolls/${id}/payments/`)
  return res.data
}

export async function createPayroll(
  payload: CreatePayrollPayload
): Promise<PayrollDTO> {
  const res = await api.post<PayrollDTO>(`${BASE_PATH}/payrolls/`, payload)
  return res.data
}

export async function createPayrollOnchain(
  id: number
): Promise<CreateOnchainResponse> {
  const res = await api.post<CreateOnchainResponse>(
    `${BASE_PATH}/payrolls/${id}/create_onchain/`
  )
  return res.data
}
