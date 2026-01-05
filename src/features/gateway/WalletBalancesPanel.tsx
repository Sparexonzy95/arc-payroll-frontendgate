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
    <Card className="relative rounded-2xl border border-subtle bg-surface-elevated p-4 sm:p-6">
      <div
        className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full blur-3xl"
        style={{ background: 'var(--arc-primary-muted)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-5 right-0 h-20 w-20 rounded-full blur-2xl"
        style={{ background: 'rgba(37, 99, 235, 0.10)' }}
      />

      <div className="mb-4 min-w-0">
        <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-ink-primary">
          Wallet Balances
        </h3>
        <p className="mt-1 text-xs text-ink-soft">Balances detected from connected wallet</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="rounded-xl border border-subtle bg-surface-sunken p-3 sm:px-4 sm:py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <IconBadge>
                <IconWallet size={18} stroke={2} />
              </IconBadge>
              <div className="min-w-0">
                <div className="truncate font-medium text-ink-primary">Arc Testnet Wallet</div>
                <div className="text-[11px] text-ink-soft">Available in wallet</div>
              </div>
            </div>
            <div className="text-left sm:text-right min-w-0">
              <div className="font-mono text-[15px] sm:text-base text-ink-primary truncate">{arcLabel}</div>
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
                <div className="truncate font-medium text-ink-primary">Base Sepolia Wallet</div>
                <div className="text-[11px] text-ink-soft">Available in wallet</div>
              </div>
            </div>
            <div className="text-left sm:text-right min-w-0">
              <div className="font-mono text-[15px] sm:text-base text-ink-primary truncate">{baseLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
