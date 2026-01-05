const RAW_BASE = ((import.meta as any).env?.VITE_API_BASE_URL ?? '').trim()
const API_BASE = RAW_BASE.replace(/\/+$/, '')

function joinUrl(base: string, path: string) {
  if (!base) return path
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

async function http<T>(path: string): Promise<T> {
  const res = await fetch(joinUrl(API_BASE, path), {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const data = await res.json()
      msg = data?.detail ?? JSON.stringify(data)
    } catch {}
    throw new Error(msg)
  }
  return (await res.json()) as T
}

export type Token = {
  id: number
  symbol: string
  name: string
  address: string
  decimals: number
  is_supported: boolean
  chain: number
}

export async function fetchTokens() {
  return http<Token[]>('/chains/tokens/')
}
