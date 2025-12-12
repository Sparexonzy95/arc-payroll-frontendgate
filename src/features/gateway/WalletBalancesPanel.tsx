// src/features/gateway/WalletBalancesPanel.tsx
import { Card } from '../../components/ui/Card'
import { Wallet, Coins } from 'lucide-react'

interface Props {
  arcLabel: string
  baseLabel: string
}

/**
 * Wallet balances on Arc & Base.
 * Exact same structure as Employer Treasury panel.
 */
export function WalletBalancesPanel({ arcLabel, baseLabel }: Props) {
  return (
    <Card className="relative rounded-2xl border border-subtle bg-surface-elevated p-6 shadow-soft">
      {/* Glow accents, matched with Employer Treasury theme */}
      <div className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full bg-[#1a5bab]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-4 right-0 h-20 w-20 rounded-full bg-[#4189e1]/30 blur-2xl" />

      <h3 className="mb-4 text-sm font-heading font-semibold uppercase tracking-wide text-ink-primary">
        Wallet Balances
      </h3>

      {/* Balances */}
      <div className="space-y-4">
        {/* Arc Wallet */}
        <div className="flex items-center justify-between rounded-xl border border-subtle bg-surface-sunken px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4189e1]/20 ring-1 ring-[#4189e1]/45">
              <Wallet className="h-5 w-5 text-[#e3eefa]" />
            </div>
            <div className="font-medium text-ink-primary">
              Arc Testnet Wallet
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-base text-ink-primary">
              {arcLabel}
            </div>
            <div className="text-[11px] text-ink-soft">
              Available in wallet
            </div>
          </div>
        </div>

        {/* Base Wallet */}
        <div className="flex items-center justify-between rounded-xl border border-subtle bg-surface-sunken px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#164c90]/25 ring-1 ring-[#164c90]/45">
              <Coins className="h-5 w-5 text-[#e3eefa]" />
            </div>
            <div className="font-medium text-ink-primary">
              Base Sepolia Wallet
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-base text-ink-primary">
              {baseLabel}
            </div>
            <div className="text-[11px] text-ink-soft">
              Available in wallet
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
