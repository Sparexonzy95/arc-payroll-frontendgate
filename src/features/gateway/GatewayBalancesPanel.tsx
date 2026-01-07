// src/features/gateway/GatewayBalancesPanel.tsx
import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { IconDatabase, IconCoin } from '@tabler/icons-react'
import { IconBadge, formatUSDC } from './_shared'

interface Props {
  employer: any
}

interface GatewayBalances {
  arc_usdc: number
  base_usdc: number
}

/**
 * Employer treasury balances inside Circle Gateway.
 * Fetches USDC balances on each chain (Arc & Base) from the backend.
 */
export function GatewayBalancesPanel({ employer }: Props) {
  const employerId = useMemo(() => employer?.id ?? null, [employer?.id])

  const [balances, setBalances] = useState<GatewayBalances | null>(null)
  const [loading, setLoading] = useState(false) // background only
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!employerId) {
      setBalances(null)
      setError(null)
      return
    }

    let cancelled = false
    const REFRESH_MS = 15_000

    async function loadBalances() {
      try {
        if (!cancelled) {
          setLoading(true)
          setError(null)
        }

        const res = await fetch('/api/gateway/balances/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employer_id: employerId }),
        })

        const data: any = await res.json().catch(() => null as any)

        if (!res.ok) {
          console.error('Gateway balances error response', data)
          let msg = 'Could not load treasury balances'
          if (data?.detail) msg = String(data.detail)
          else if (typeof data === 'object' && data !== null) {
            const firstKey = Object.keys(data)[0]
            if (firstKey && Array.isArray((data as any)[firstKey])) {
              msg = `${firstKey}: ${(data as any)[firstKey][0]}`
            }
          }
          throw new Error(msg)
        }

        if (cancelled) return

        const list: any[] = Array.isArray(data?.balances) ? data.balances : []
        const ARC_DOMAIN = 26
        const BASE_DOMAIN = 6

        const arcEntry = list.find((b) => b.domain === ARC_DOMAIN)
        const baseEntry = list.find((b) => b.domain === BASE_DOMAIN)

        const arc_usdc = arcEntry ? Number(arcEntry.balance) || 0 : 0
        const base_usdc = baseEntry ? Number(baseEntry.balance) || 0 : 0

        setBalances({ arc_usdc, base_usdc })
      } catch (err: any) {
        console.error('Error fetching gateway balances', err)
        if (!cancelled) {
          setError(err?.message || 'Could not load treasury balances')
          // keep last known balances if any instead of nuking UI
          setBalances((prev) => prev ?? { arc_usdc: 0, base_usdc: 0 })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBalances()
    const interval = window.setInterval(loadBalances, REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [employerId])

  if (!employer) {
    return (
      <Card className="rounded-2xl border border-subtle bg-surface-elevated p-4 sm:p-6">
        <p className="text-sm text-ink-soft">No employer selected.</p>
      </Card>
    )
  }

  const arc = balances?.arc_usdc ?? 0
  const base = balances?.base_usdc ?? 0

  return (
    <Card
  className="relative rounded-[18px] border border-subtle bg-surface-elevated p-5 sm:p-6"
  style={{ boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}
>

     <div
  className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full blur-3xl"
  style={{ background: 'rgba(12,43,81,0.08)' }}
/>
<div
  className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full blur-3xl"
  style={{ background: 'rgba(12,43,81,0.06)' }}
/>


      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
         <h3 className="text-[16px] font-semibold" style={{ color: '#0c2b51' }}>
  Employer Treasury
</h3>
<p className="mt-1 text-[13px]" style={{ color: 'var(--arc-ink-soft)' }}>
  Circle Gateway balances by network{loading ? ' · refreshing' : ''}
</p>

        </div>
      </div>

      {error ? (
        <p className="mb-3 text-xs" style={{ color: 'var(--arc-danger)' }}>
          {error}
        </p>
      ) : null}

      <div className="space-y-3 sm:space-y-4">
        <div
  className="rounded-[14px] p-4"
  style={{
    border: '1px solid rgba(15,23,42,0.08)',
    background: 'rgba(15,23,42,0.02)',
  }}
>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div
  className="flex h-10 w-10 items-center justify-center rounded-full"
  style={{ background: 'rgba(12,43,81,0.10)' }}
>
  <IconDatabase size={18} style={{ color: '#0c2b51' }} />
</div>
              <div className="min-w-0">
                <div className="truncate font-medium text-ink-primary">Arc Testnet USDC</div>
                <div className="text-[11px]" style={{ color: 'var(--arc-ink-muted)' }}>
  Available USDC balance
</div>

              </div>
            </div>
            <div className="text-left sm:text-right min-w-0">
              <div
  className="font-mono text-[18px] sm:text-[20px] font-semibold truncate"
  style={{ color: '#0c2b51' }}
>
  {formatUSDC(arc, 6)}
</div>
            </div>
          </div>
        </div>

        <div
  className="rounded-[14px] p-4"
  style={{
    border: '1px solid rgba(15,23,42,0.08)',
    background: 'rgba(15,23,42,0.02)',
  }}
>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
             <div
  className="flex h-10 w-10 items-center justify-center rounded-full"
  style={{ background: 'rgba(12,43,81,0.10)' }}
>
  <IconDatabase size={18} style={{ color: '#0c2b51' }} />
</div>
              <div className="min-w-0">
                <div className="truncate font-medium text-ink-primary">Base Sepolia USDC</div>
                <div className="text-[11px]" style={{ color: 'var(--arc-ink-muted)' }}>
  Available USDC balance
</div>
              </div>
            </div>
            <div className="text-left sm:text-right min-w-0">
              <div
  className="font-mono text-[18px] sm:text-[20px] font-semibold truncate"
  style={{ color: '#0c2b51' }}
>
  {formatUSDC(base, 6)}
</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
