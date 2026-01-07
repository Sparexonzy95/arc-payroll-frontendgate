// src/features/gateway/WalletBalancesPanel.tsx
import { Card } from '../../components/ui/Card'
import { IconWallet, IconCoin } from '@tabler/icons-react'
import { IconBadge } from './_shared'

interface Props {
  arcLabel: string
  baseLabel: string
}

export function WalletBalancesPanel({ arcLabel, baseLabel }: Props) {
  return (
    <Card
      className="relative rounded-[18px] border border-subtle bg-surface-elevated p-5 sm:p-6"
      style={{ boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}
    >
      {/* background glow */}
      <div
        className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full blur-3xl"
        style={{ background: 'rgba(12,43,81,0.08)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full blur-3xl"
        style={{ background: 'rgba(12,43,81,0.06)' }}
      />

      {/* HEADER */}
      <div className="mb-4 min-w-0">
        <h3 className="text-[16px] font-semibold" style={{ color: '#0c2b51' }}>
          Wallet Balances
        </h3>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--arc-ink-soft)' }}>
          Balances detected from connected wallet
        </p>
      </div>

      {/* BALANCES */}
      <div className="space-y-3 sm:space-y-4">
        {/* ARC */}
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
                <IconCoin size={18} style={{ color: '#0c2b51' }} />
              </div>

              <div className="min-w-0">
                <div className="truncate font-medium text-ink-primary">
                  Arc Testnet Wallet
                </div>
                <div className="text-[11px]" style={{ color: 'var(--arc-ink-muted)' }}>
                  Available balance
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right min-w-0">
              <div
                className="font-mono text-[18px] sm:text-[20px] font-semibold truncate"
                style={{ color: '#0c2b51' }}
              >
                {arcLabel}
              </div>
            </div>
          </div>
        </div>

        {/* BASE */}
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
                <IconWallet size={18} style={{ color: '#0c2b51' }} />
              </div>

              <div className="min-w-0">
                <div className="truncate font-medium text-ink-primary">
                  Base Sepolia Wallet
                </div>
                <div className="text-[11px]" style={{ color: 'var(--arc-ink-muted)' }}>
                  Available balance
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right min-w-0">
              <div
                className="font-mono text-[18px] sm:text-[20px] font-semibold truncate"
                style={{ color: '#0c2b51' }}
              >
                {baseLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
