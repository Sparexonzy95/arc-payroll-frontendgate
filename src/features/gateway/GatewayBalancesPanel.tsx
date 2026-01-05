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
    <Card className="relative rounded-2xl border border-subtle bg-surface-elevated p-4 sm:p-6">
      <div
        className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full blur-3xl"
        style={{ background: 'var(--arc-primary-muted)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-5 right-0 h-20 w-20 rounded-full blur-2xl"
        style={{ background: 'rgba(37, 99, 235, 0.10)' }}
      />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-ink-primary">
            Employer Treasury
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            Circle Gateway balances by domain{loading ? ' (refreshing...)' : ''}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mb-3 text-xs" style={{ color: 'var(--arc-danger)' }}>
          {error}
        </p>
      ) : null}

      <div className="space-y-3 sm:space-y-4">
        <div className="rounded-xl border border-subtle bg-surface-sunken p-3 sm:px-4 sm:py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <IconBadge>
                <IconDatabase size={18} stroke={2} />
              </IconBadge>
              <div className="min-w-0">
                <div className="truncate font-medium text-ink-primary">Arc Testnet USDC</div>
                <div className="text-[11px] text-ink-soft">Available liquidity</div>
              </div>
            </div>
            <div className="text-left sm:text-right min-w-0">
              <div className="font-mono text-[15px] sm:text-base text-ink-primary truncate">
                {formatUSDC(arc, 6)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-subtle bg-surface-sunken p-3 sm:px-4 sm:py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <IconBadge>
                <IconCoin size={18} stroke={2} />
              </IconBadge>
              <div className="min-w-0">
                <div className="truncate font-medium text-ink-primary">Base Sepolia USDC</div>
                <div className="text-[11px] text-ink-soft">Available liquidity</div>
              </div>
            </div>
            <div className="text-left sm:text-right min-w-0">
              <div className="font-mono text-[15px] sm:text-base text-ink-primary truncate">
                {formatUSDC(base, 6)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
