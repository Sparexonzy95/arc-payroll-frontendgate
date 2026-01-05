// src/features/gateway/_shared.tsx
import type { ReactNode } from 'react'

export function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1"
      style={{
        background: 'rgba(11,58,138,0.08)',
        border: '1px solid var(--arc-divider)',
        boxShadow: '0 10px 24px rgba(2,6,23,0.04)',
      }}
    >
      <div style={{ color: 'var(--arc-primary)' }}>{children}</div>
    </div>
  )
}

export function formatUSDC(n: number, maxFrac = 6) {
  const safe = Number.isFinite(n) ? n : 0
  return safe.toLocaleString(undefined, { maximumFractionDigits: maxFrac })
}

export function isValidPositiveAmount(input: string) {
  const s = input.trim()
  if (!s) return false
  if (!/^\d+(\.\d+)?$/.test(s)) return false
  const n = Number(s)
  return Number.isFinite(n) && n > 0
}
