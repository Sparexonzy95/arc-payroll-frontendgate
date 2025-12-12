// src/features/gateway/GatewayBalancesPanel.tsx
import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { CircleDollarSign, Database } from 'lucide-react'

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
  const [balances, setBalances] = useState<GatewayBalances | null>(null)
  const [loading, setLoading] = useState(false) // background only, not shown
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // No employer yet → nothing to fetch
    if (!employer || !employer.id) {
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
          headers: {
            'Content-Type': 'application/json',
          },
          // backend explicitly wants employer_id
          body: JSON.stringify({
            employer_id: employer.id,
          }),
        })

        const data: any = await res.json().catch(() => null as any)

        if (!res.ok) {
          console.error('Gateway balances error response', data)
          let msg = 'Could not load treasury balances'
          if (data?.detail) {
            msg = String(data.detail)
          } else if (typeof data === 'object' && data !== null) {
            const firstKey = Object.keys(data)[0]
            if (firstKey && Array.isArray((data as any)[firstKey])) {
              msg = `${firstKey}: ${(data as any)[firstKey][0]}`
            }
          }
          throw new Error(msg)
        }

        if (cancelled) return

        console.log('Gateway balances response', data)

        // Shape:
        // {
        //   token: "USDC",
        //   balances: [
        //     { domain: 26, depositor: "...", balance: "0.620000" },
        //     { domain: 6,  depositor: "...", balance: "0.100000" }
        //   ]
        // }

        const list: any[] = Array.isArray(data?.balances)
          ? data.balances
          : []

        const ARC_DOMAIN = 26
        const BASE_DOMAIN = 6

        const arcEntry = list.find((b) => b.domain === ARC_DOMAIN)
        const baseEntry = list.find((b) => b.domain === BASE_DOMAIN)

        const arc_usdc = arcEntry ? Number(arcEntry.balance) || 0 : 0
        const base_usdc = baseEntry ? Number(baseEntry.balance) || 0 : 0

        setBalances({
          arc_usdc,
          base_usdc,
        })
      } catch (err: any) {
        console.error('Error fetching gateway balances', err)
        if (!cancelled) {
          setError(err?.message || 'Could not load treasury balances')
          setBalances({ arc_usdc: 0, base_usdc: 0 })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // initial fetch
    loadBalances()

    // periodic refresh in background
    const interval = window.setInterval(() => {
      loadBalances()
    }, REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [employer])

  if (!employer) {
    return (
      <Card className="p-6 rounded-2xl border border-subtle bg-surface-elevated">
        <p className="text-sm text-ink-soft">No employer selected.</p>
      </Card>
    )
  }

  const arc = balances?.arc_usdc ?? 0
  const base = balances?.base_usdc ?? 0

  return (
    <Card className="relative rounded-2xl border border-subtle bg-surface-elevated p-6 shadow-soft">
      {/* theme glows */}
      <div className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full bg-[#1a5bab]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-4 right-0 h-20 w-20 rounded-full bg-[#4189e1]/30 blur-2xl" />

      <h3 className="mb-4 text-sm font-heading font-semibold uppercase tracking-wide text-ink-primary">
        Employer Treasury
      </h3>

      {/* Only show error if it's actually broken */}
      {error && (
        <p className="mb-3 text-xs text-rose-300">{error}</p>
      )}

      {/* Balances */}
      <div className="space-y-4">
        {/* Arc balance */}
        <div className="flex items-center justify-between rounded-xl border border-subtle bg-surface-sunken px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4189e1]/20 ring-1 ring-[#4189e1]/45">
              <Database className="h-5 w-5 text-[#e3eefa]" />
            </div>
            <div className="font-medium text-ink-primary">
              Arc Testnet USDC
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-base text-ink-primary">
              {arc.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}
            </div>
            <div className="text-[11px] text-ink-soft">
              Available liquidity
            </div>
          </div>
        </div>

        {/* Base balance */}
        <div className="flex items-center justify-between rounded-xl border border-subtle bg-surface-sunken px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5bab]/20 ring-1 ring-[#1a5bab]/45">
              <CircleDollarSign className="h-5 w-5 text-[#e3eefa]" />
            </div>
            <div className="font-medium text-ink-primary">
              Base Sepolia USDC
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-base text-ink-primary">
              {base.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}
            </div>
            <div className="text-[11px] text-ink-soft">
              Available liquidity
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
