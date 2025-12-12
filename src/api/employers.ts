import { api } from './client'

export interface Employer {
  id: number
  name: string
  email: string
  wallet_address: string
}

export interface CreateEmployerPayload {
  name: string
  email: string
  wallet_address: string
}

export async function fetchEmployers(): Promise<Employer[]> {
  const res = await api.get<Employer[]>('/api/accounts/employers/')
  return res.data
}

export async function createEmployer(
  payload: CreateEmployerPayload
): Promise<Employer> {
  const res = await api.post<Employer>('/api/accounts/employers/', payload)
  return res.data
}
