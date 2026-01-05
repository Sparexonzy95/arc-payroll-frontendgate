import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'

type Props = {
  toolLabel: string
  requiredChainLabel: string
  currentChainLabel: string
  canSwitch: boolean
  loading: boolean
  onSwitch: () => void
  switchError?: unknown
}

const TOKENS = {
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  divider: 'rgba(15,23,42,0.06)',
  danger: '#DC2626',
  dangerBg: 'rgba(220,38,38,0.10)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.14)',
}

export function DashboardNetworkGate({
  toolLabel,
  requiredChainLabel,
  currentChainLabel,
  canSwitch,
  loading,
  onSwitch,
  switchError,
}: Props) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-3">
        {/* alert chip */}
        <div
          className="inline-flex h-7 items-center rounded-full px-[10px] text-[12px] font-medium"
          style={{
            background: TOKENS.warningBg,
            color: TOKENS.warning,
            width: 'fit-content',
          }}
        >
          Wrong network
        </div>

        <div className="space-y-1">
          <h2 className="text-[16px] sm:text-[18px] font-semibold" style={{ color: TOKENS.textPrimary }}>
            Wrong network for {toolLabel}
          </h2>

          <p className="text-[14px]" style={{ color: TOKENS.textSecondary }}>
            Switch to <span style={{ color: TOKENS.textPrimary, fontWeight: 600 }}>{requiredChainLabel}</span>.
            {' '}Current:{' '}
            <span style={{ color: TOKENS.textPrimary, fontWeight: 600 }}>{currentChainLabel}</span>.
          </p>
        </div>

        {!canSwitch && (
          <p className="text-[12px]" style={{ color: TOKENS.textMuted }}>
            Your wallet connector doesn’t have this chain configured. Switch manually in your wallet,
            or add Arc Testnet to your wagmi chains config.
          </p>
        )}

        {switchError && (
          <div
            className="rounded-[10px] px-3 py-2 text-[12px]"
            style={{ background: TOKENS.dangerBg, color: TOKENS.danger }}
          >
            Switch error: {String((switchError as any)?.message ?? switchError)}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${TOKENS.divider}` }} />

        <div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            loading={loading}
            onClick={onSwitch}
            disabled={!canSwitch}
          >
            Switch network
          </Button>
        </div>
      </div>
    </Card>
  )
}
