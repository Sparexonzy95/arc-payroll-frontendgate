// src/features/escrow/escrow.api.ts

const RAW_BASE = ((import.meta as any).env?.VITE_API_BASE_URL ?? '').trim()
const API_BASE = RAW_BASE.replace(/\/+$/, '')

// Backend mounts escrow at: /api/escrow/...
const ESCROW_PREFIX = (((import.meta as any).env?.VITE_ESCROW_API_PREFIX ?? '/escrow') as string)
  .trim()
  .replace(/\/+$/, '')

function joinUrl(base: string, path: string) {
  if (!base) return path
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

function escrowPath(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${ESCROW_PREFIX}${p}`
}

// Convert "/media/..." -> "http://host/media/..." using API_BASE origin
function absoluteUrl(u: string) {
  if (!u) return u
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('//')) return `https:${u}`

  try {
    // API_BASE is like http://localhost:8000/api
    const base = new URL(API_BASE)
    const origin = `${base.protocol}//${base.host}`
    if (u.startsWith('/')) return `${origin}${u}`
    return `${origin}/${u}`
  } catch {
    return u
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(joinUrl(API_BASE, path), {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })

  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const data = await res.json()
      msg = (data as any)?.detail ?? JSON.stringify(data)
    } catch {}
    throw new Error(msg)
  }

  return (await res.json()) as T
}

export type DeliveryType = 'design' | 'code' | 'service' | 'goods'
export type EscrowStatus = 'AWAITING_DEPOSIT' | 'FUNDED' | 'RELEASED' | 'REFUNDED'

export type Escrow = {
  id: number
  chain: number
  token: number
  contract_address: string
  escrow_id: number

  payer_wallet: string
  payee_wallet: string
  arbiter_wallet: string

  amount_raw: string
  timeout_seconds: number
  terms_hash: string
  agreement: number | null

  status: EscrowStatus
  disputed: boolean

  created_at: string
  funded_at: string | null
  closed_at: string | null

  payer_evidence_hash: string | null
  payee_evidence_hash: string | null
}

export type AgreementCreateInput = {
  title: string
  delivery_type: DeliveryType
  deadline_at?: string | null
  acceptance_window_hours?: number
  version?: number
}

export type Agreement = {
  id: number
  title: string
  delivery_type: DeliveryType
  deadline_at: string | null
  acceptance_window_hours: number
  version: number
  terms_hash: string
}

export async function createAgreement(input: AgreementCreateInput) {
  return http<Agreement>(escrowPath('/agreements/'), {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function listEscrows(wallet?: string) {
  const qs = wallet ? `?wallet=${encodeURIComponent(wallet)}` : ''
  return http<Escrow[]>(escrowPath(`/escrows/list/${qs}`))
}

export async function getEscrow(pk: number) {
  return http<Escrow>(escrowPath(`/escrows/${pk}/`))
}

export type EscrowCreateInput = {
  chain: number
  token: number
  contract_address: string
  escrow_id: number

  payer_wallet: string
  payee_wallet: string
  arbiter_wallet: string

  amount_raw: string
  timeout_seconds: number
  terms_hash: string
  agreement?: number | null
}

export async function createEscrow(input: EscrowCreateInput) {
  return http<Escrow>(escrowPath('/escrows/'), {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      agreement: input.agreement ?? null,
    }),
  })
}

// -----------------------------
// Live chat
// -----------------------------
export type ChatMessage = {
  id: number
  escrow: number
  sender_wallet: string
  message: string
  created_at: string
}

export async function listMessages(escrowPk: number) {
  return http<ChatMessage[]>(escrowPath(`/escrows/${escrowPk}/messages/`))
}

export async function createMessage(input: {
  escrow: number
  sender_wallet: string
  message: string
}) {
  return http<ChatMessage>(escrowPath('/messages/'), {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// -----------------------------
// Evidence
// -----------------------------
export type EvidenceFile = {
  name: string
  type?: string
  size?: number
  url?: string
  dataUrl?: string // (optional, if you ever store inline)
}

export type Evidence = {
  id: number
  escrow: number
  submitted_by_wallet: string
  bundle: Record<string, any>
  files: EvidenceFile[]
  evidence_hash: string
  created_at: string
}

export async function listEvidence(escrowPk: number) {
  const out = await http<Evidence[]>(escrowPath(`/escrows/${escrowPk}/evidence/`))
  // normalize urls
  return (out ?? []).map((e) => ({
    ...e,
    files: (e.files ?? []).map((f) => ({
      ...f,
      url: f.url ? absoluteUrl(String(f.url)) : f.url,
    })),
    bundle: {
      ...(e.bundle ?? {}),
      files: Array.isArray((e.bundle as any)?.files)
        ? (e.bundle as any).files.map((f: any) => ({
            ...f,
            url: f.url ? absoluteUrl(String(f.url)) : f.url,
          }))
        : (e.bundle as any)?.files,
    },
  }))
}

// legacy JSON evidence (kept)
export async function createEvidence(input: {
  escrow: number
  submitted_by_wallet: string
  bundle: Record<string, any>
  files: any[]
}) {
  return http<Evidence>(escrowPath('/evidence/'), {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ✅ Production: multipart upload evidence
export async function createEvidenceUpload(input: {
  escrow: number
  submitted_by_wallet: string
  bundle?: Record<string, any>
  files: File[]
}) {
  const fd = new FormData()
  fd.set('escrow', String(input.escrow))
  fd.set('submitted_by_wallet', input.submitted_by_wallet)
  fd.set('bundle', JSON.stringify(input.bundle ?? {}))
  input.files.forEach((f) => fd.append('files', f))

  const res = await fetch(joinUrl(API_BASE, escrowPath('/evidence/')), {
    method: 'POST',
    body: fd,
  })

  if (!res.ok) {
    let msg = `Upload failed (${res.status})`
    try {
      const data = await res.json()
      msg = (data as any)?.detail ?? JSON.stringify(data)
    } catch {}
    throw new Error(msg)
  }

  const ev = (await res.json()) as Evidence

  // normalize urls
  const filesNorm = (ev.files ?? []).map((f) => ({ ...f, url: f.url ? absoluteUrl(String(f.url)) : f.url }))
  return { ...ev, files: filesNorm }
}

// -----------------------------
// Disputes
// -----------------------------
export type Dispute = {
  id: number
  escrow: number
  opened_by_wallet: string
  status: 'OPEN' | 'RESOLVED'
  opened_at: string
}

export async function createDispute(input: { escrow: number; opened_by_wallet: string }) {
  return http<Dispute>(escrowPath('/disputes/'), {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// -----------------------------
// Invites
// -----------------------------
export type EscrowInvite = {
  id: number
  token: string
  expires_at: string
  escrow: number | null
  claimed_at: string | null
  claimed_by_wallet: string | null
}

export async function createInvite(input: { escrow?: number | null; expires_in_minutes?: number }) {
  return http<EscrowInvite>(escrowPath('/invites/'), {
    method: 'POST',
    body: JSON.stringify({
      escrow: input.escrow ?? null,
      expires_in_minutes: input.expires_in_minutes ?? 60,
    }),
  })
}

export async function claimInvite(inviteToken: string, input: { wallet: string; signature: string }) {
  return http<EscrowInvite>(escrowPath(`/invites/${inviteToken}/claim/`), {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function syncEscrow(pk: number) {
  return http<any>(escrowPath(`/escrows/${pk}/sync/`), { method: 'POST' })
}
