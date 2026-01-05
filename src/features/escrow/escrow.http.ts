// src/features/escrow/escrow.http.ts
const RAW_BASE = ((import.meta as any).env?.VITE_API_BASE_URL ?? '').trim()
const API_BASE = RAW_BASE.replace(/\/+$/, '')

function joinUrl(base: string, path: string) {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

export type ChainRow = {
  id: number
  name: string
  chain_id: number
}

export async function fetchChains(): Promise<ChainRow[]> {
  const res = await fetch(joinUrl(API_BASE, '/chains/chains/'))
  if (!res.ok) throw new Error(`Failed to fetch chains (${res.status})`)
  return res.json()
}

export async function ingestEscrowTx(params: {
  chain_id: number
  tx_hash: `0x${string}`
  contract_address: `0x${string}`
}) {
  if (!API_BASE) throw new Error('Missing VITE_API_BASE_URL')
  const res = await fetch(joinUrl(API_BASE, '/escrow/escrows/ingest/'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `Failed to ingest escrow (${res.status})`)
  return data
}

export async function syncEscrowNow(dbPk: number) {
  if (!API_BASE) throw new Error('Missing VITE_API_BASE_URL')
  const res = await fetch(joinUrl(API_BASE, `/escrow/escrows/${dbPk}/sync/`), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `Failed to sync escrow (${res.status})`)
  return data
}

export async function ingestDisputeTx(dbPk: number, tx_hash: `0x${string}`) {
  if (!API_BASE) throw new Error('Missing VITE_API_BASE_URL')
  const res = await fetch(joinUrl(API_BASE, `/escrow/escrows/${dbPk}/ingest-dispute/`), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tx_hash }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `Failed to ingest dispute (${res.status})`)
  return data
}

export async function ingestEvidenceTx(dbPk: number, tx_hash: `0x${string}`) {
  if (!API_BASE) throw new Error('Missing VITE_API_BASE_URL')
  const res = await fetch(joinUrl(API_BASE, `/escrow/escrows/${dbPk}/ingest-evidence/`), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tx_hash }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `Failed to ingest evidence (${res.status})`)
  return data
}

export async function ingestResolveTx(dbPk: number, tx_hash: `0x${string}`) {
  if (!API_BASE) throw new Error('Missing VITE_API_BASE_URL')
  const res = await fetch(joinUrl(API_BASE, `/escrow/escrows/${dbPk}/ingest-resolve/`), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tx_hash }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `Failed to ingest resolve (${res.status})`)
  return data
}
