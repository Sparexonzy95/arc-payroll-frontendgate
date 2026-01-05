import { Link } from 'react-router-dom'
import { ArrowRight, Wallet } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'

type Props = {
  loading: boolean
  onConnect: () => void
}

const TOKENS = {
  primary: '#0B3A8A',
  primaryMuted: 'rgba(11,58,138,0.08)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  divider: 'rgba(15,23,42,0.06)',
  border: 'rgba(15,23,42,0.08)',
}

export function DashboardConnectGate({ loading, onConnect }: Props) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        {/* top chip */}
        <div
          className="inline-flex h-7 items-center gap-2 rounded-full px-[10px] text-[12px] font-medium"
          style={{
            background: TOKENS.primaryMuted,
            color: TOKENS.primary,
          }}
        >
          <Wallet size={16} strokeWidth={1.5} />
          Connect wallet
        </div>

        <div className="space-y-1">
          <h2 className="text-[18px] sm:text-[22px] font-semibold" style={{ color: TOKENS.textPrimary }}>
            You’re not connected yet
          </h2>

          <p className="text-[14px]" style={{ color: TOKENS.textSecondary }}>
            Connect your wallet to access payrolls, bridge USDC with Gateway, and start saving.
            Once connected, you’ll bind your wallet to an employer profile to unlock the tools.
          </p>
        </div>

        <div style={{ borderTop: `1px solid ${TOKENS.divider}` }} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            className="w-full sm:w-auto"
            loading={loading}
            onClick={onConnect}
          >
            Connect wallet
            <ArrowRight size={16} strokeWidth={1.75} />
          </Button>

          <Link to="/" className="w-full sm:w-auto">
            <Button type="button" variant="secondary" className="w-full sm:w-auto">
              Back to home
            </Button>
          </Link>

          <div className="text-[12px] sm:ml-auto" style={{ color: TOKENS.textMuted }}>
            Tip: if you don’t see the connect button, open the menu on mobile.
          </div>
        </div>
      </div>
    </Card>
  )
}
