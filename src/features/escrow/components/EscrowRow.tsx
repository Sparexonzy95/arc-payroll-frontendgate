// src/features/escrow/components/EscrowRow.tsx
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { EscrowActions } from './EscrowActions'
import { EscrowDetailsDrawer } from './EscrowDetailsDrawer'
import { shortAddr } from '../utils/hashing'
import { readOnchainEscrow } from '../utils/onchain'
import {
  IconAlertTriangle,
  IconCircleCheckFilled,
  IconClock,
  IconCoins,
  IconFileDescription,
  IconLock,
  IconUser,
  IconShieldCheck,
} from '@tabler/icons-react'

const NAVY = '#0E2A55'

// Arcflow button tokens (theme-safe)
const BTN = {
  primaryBg: NAVY,
  primaryFg: '#FFFFFF',
  secondaryBg: '#F6F8FC',
  secondaryFg: NAVY,
  secondaryBorder: 'rgba(15, 23, 42, 0.12)', // slate-900/12
}

function statusLabel(onchainStatus: number | null, disputed: boolean) {
  if (disputed) return 'DISPUTED'
  if (onchainStatus === 0) return 'AWAITING DEPOSIT'
  if (onchainStatus === 1) return 'FUNDED (LOCKED)'
  if (onchainStatus === 2) return 'RELEASED'
  if (onchainStatus === 3) return 'REFUNDED'
  return 'UNKNOWN'
}

function statusMeta(label: string) {
  if (label === 'AWAITING DEPOSIT') return { tone: 'neutral', icon: IconClock }
  if (label === 'FUNDED (LOCKED)') return { tone: 'info', icon: IconLock }
  if (label === 'RELEASED') return { tone: 'success', icon: IconCircleCheckFilled }
  if (label === 'REFUNDED') return { tone: 'success', icon: IconCircleCheckFilled }
  if (label === 'DISPUTED') return { tone: 'danger', icon: IconAlertTriangle }
  return { tone: 'neutral', icon: IconShieldCheck }
}

function StatusChip({ label }: { label: string }) {
  const meta = statusMeta(label)
  const Icon = meta.icon

  const cls =
    meta.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : meta.tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : meta.tone === 'info'
      ? 'border-sky-200 bg-sky-50 text-sky-700'
      : 'border-slate-200 bg-slate-50 text-slate-700'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      <Icon size={14} stroke={1.9} />
      {label}
    </span>
  )
}

function ApprovalLine(props: { title: string; a: boolean; b: boolean; aLabel: string; bLabel: string }) {
  const { title, a, b, aLabel, bLabel } = props
  const ok = (v: boolean) => (v ? '✅' : '⏳')
  return (
    <div className="text-[11px] text-slate-600">
      <span className="font-semibold text-slate-700">{title}:</span>{' '}
      <span className="text-slate-700">
        {aLabel} {ok(a)}
      </span>
      <span className="text-slate-400"> / </span>
      <span className="text-slate-700">
        {bLabel} {ok(b)}
      </span>
    </div>
  )
}

export function EscrowRow(props: {
  e: any
  address?: string
  wrongChain: boolean
  tokensReady: boolean
  arcTokens: any[]
  disputeFee: bigint | null
  busy: boolean
  setBusy: (v: boolean) => void
  walletClient: any
  publicClient: any
  onRefresh: () => Promise<void>
}) {
  const { e, publicClient } = props
  const [open, setOpen] = useState(false)

  const escrowId = BigInt(Number(e.escrow_id))

  const onchainQ = useQuery({
    queryKey: ['onchain-escrow', String(escrowId)],
    queryFn: () => readOnchainEscrow(publicClient, escrowId),
    enabled: !!publicClient && Number.isFinite(Number(e.escrow_id)) && Number(e.escrow_id) > 0,
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  })

  const onchain = onchainQ.data ?? null

  const disputed = onchain ? onchain.disputed : !!e.disputed
  const onchainStatus = onchain ? onchain.status : null
  const label = statusLabel(onchainStatus, disputed)

  const payeeLabel = useMemo(() => shortAddr(e.payee_wallet), [e.payee_wallet])
  const arbiterLabel = useMemo(() => shortAddr(e.arbiter_wallet), [e.arbiter_wallet])

  return (
    <div className="rounded-3xl border border-slate-200 bg-[#F6F8FC] p-3 sm:p-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
        {/* Top line */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">
                Escrow #{e.escrow_id}
              </div>
              <StatusChip label={label} />
              {onchainQ.isLoading ? (
                <span className="text-[11px] text-slate-400">syncing…</span>
              ) : onchainQ.isError ? (
                <span className="text-[11px] text-rose-600">on-chain unavailable</span>
              ) : null}
            </div>

            {onchain && onchain.status === 1 && !onchain.disputed && (
              <div className="mt-2 space-y-1">
                <ApprovalLine
                  title="Release approvals"
                  a={onchain.payerApprovedRelease}
                  b={onchain.payeeApprovedRelease}
                  aLabel="Payer"
                  bLabel="Payee"
                />
                <ApprovalLine
                  title="Refund approvals"
                  a={onchain.payerApprovedRefund}
                  b={onchain.payeeApprovedRefund}
                  aLabel="Payer"
                  bLabel="Payee"
                />
              </div>
            )}

            {onchain && (onchain.status === 2 || onchain.status === 3) && (
              <div className="mt-2 text-[12px] text-slate-600">
                {onchain.status === 2
                  ? 'Funds have been released to the payee.'
                  : 'Funds have been refunded to the payer.'}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2">
            {/* EscrowActions keeps your existing on-chain logic.
               We only theme the surrounding button + overall panel. */}
            <EscrowActions {...props} onchain={onchain} />

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm"
              style={{
                backgroundColor: BTN.secondaryBg,
                color: BTN.secondaryFg,
                border: `1px solid ${BTN.secondaryBorder}`,
              }}
            >
              <IconFileDescription size={16} stroke={1.9} style={{ color: NAVY }} />
              Details
            </button>
          </div>
        </div>

        {/* Key-value grid */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <IconCoins size={16} stroke={1.9} style={{ color: NAVY }} />
            <div className="text-[11px] font-semibold text-slate-600">TokenId</div>
            <div className="ml-auto text-xs font-semibold text-slate-900">{String(e.token)}</div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <IconCoins size={16} stroke={1.9} style={{ color: NAVY }} />
            <div className="text-[11px] font-semibold text-slate-600">Amount raw</div>
            <div className="ml-auto text-xs font-semibold text-slate-900">{String(e.amount_raw)}</div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <IconUser size={16} stroke={1.9} style={{ color: NAVY }} />
            <div className="text-[11px] font-semibold text-slate-600">Payee</div>
            <div className="ml-auto text-xs font-semibold text-slate-900">{payeeLabel}</div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <IconShieldCheck size={16} stroke={1.9} style={{ color: NAVY }} />
            <div className="text-[11px] font-semibold text-slate-600">Arbiter</div>
            <div className="ml-auto text-xs font-semibold text-slate-900">{arbiterLabel}</div>
          </div>
        </div>

        {/* Theme hint for action buttons INSIDE EscrowActions (non-breaking):
            If EscrowActions accepts className in your codebase, pass it.
            If not, this does nothing and your file still compiles. */}
        {'className' in (EscrowActions as any) ? null : null}
      </div>

      <EscrowDetailsDrawer
        open={open}
        onClose={() => setOpen(false)}
        escrow={e}
        address={props.address}
        walletClient={props.walletClient}
      />
    </div>
  )
}
