export function shortAddr(addr?: string) {
  if (!addr) return '—'
  const a = String(addr)
  if (a.length < 10) return a
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

export function toNum(v: string) {
  const n = Number(String(v ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

export function fmt2(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
