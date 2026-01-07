// src/features/escrow/components/EscrowHeaderCard.tsx
import { formatUnits } from 'viem'
import { Card } from '../../../components/ui/Card'
import { ARCFLOW_ARBITER_WALLET, ARCFLOW_ESCROW_ADDRESS } from '../escrow.contract'
import {
  IconShieldCheck,
  IconFileText,
  IconScale,
  IconWorld,
  IconCircleCheckFilled,
} from '@tabler/icons-react'

const NAVY = '#0E2A55'

/* ---------- Info Pill ---------- */

function InfoPill({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: any
  label: string
  value: string
  ok?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-subtle bg-surface-elevated px-4 py-3">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken"
        style={{ color: NAVY }}
      >
        <Icon size={18} stroke={1.9} />
      </div>

      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {label}
        </div>
        <div className="mt-0.5 text-sm font-semibold text-ink-primary break-all">
          {value}
        </div>
      </div>

      {ok !== undefined && (
        <div className="ml-auto">
          {ok ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <IconCircleCheckFilled size={14} />
              OK
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-rose-400/15 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
              Check
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- Fee Pill ---------- */

function FeePill({
  creationFee,
  disputeFee,
  feeErr,
}: {
  creationFee: bigint | null
  disputeFee: bigint | null
  feeErr: string | null
}) {
  const creation =
    creationFee == null
      ? '…'
      : (() => {
          try {
            return `${formatUnits(creationFee, 18)} ARC`
          } catch {
            return `${creationFee.toString()} (raw)`
          }
        })()

  const dispute =
    disputeFee == null
      ? '—'
      : (() => {
          try {
            return `${formatUnits(disputeFee, 18)} ARC`
          } catch {
            return `${disputeFee.toString()} (raw)`
          }
        })()

  return (
    <div className="rounded-xl border border-subtle bg-surface-elevated px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sunken"
          style={{ color: NAVY }}
        >
          <IconScale size={18} stroke={1.9} />
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Fees
          </div>
          <div className="mt-0.5 text-sm font-semibold text-ink-primary">
            {feeErr ? <span className="text-rose-600">{feeErr}</span> : creation}
          </div>
          <div className="mt-1 text-[12px] text-ink-soft">
            Dispute fee: {feeErr ? '—' : dispute}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Header Card ---------- */

export function EscrowHeaderCard(props: {
  address?: string
  wrongChain: boolean
  feeErr: string | null
  creationFee: bigint | null
  disputeFee: bigint | null
}) {
  const { address, wrongChain, feeErr, creationFee, disputeFee } = props

  const networkOk = !!address && !wrongChain

  return (
    <Card className="overflow-hidden rounded-2xl border border-subtle bg-surface-elevated shadow-soft p-0">
      {/* HEADER */}
      <div
        className="relative px-5 py-6 sm:px-6 sm:py-7"
        style={{ backgroundColor: NAVY }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-white">
            <IconShieldCheck size={28} stroke={1.9} />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">
              Escrow
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/80">
              Create on-chain escrows for milestone-based payouts. Funds are
              secured by a neutral on-chain arbiter until conditions are met.
            </p>
          </div>
        </div>
      </div>

      {/* INFO GRID */}
      <div className="p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <InfoPill
            icon={IconFileText}
            label="Contract"
            value={ARCFLOW_ESCROW_ADDRESS}
          />

          <InfoPill
            icon={IconScale}
            label="Fixed arbiter"
            value={ARCFLOW_ARBITER_WALLET}
          />

          <InfoPill
            icon={IconWorld}
            label="Network"
            value={
              !address
                ? 'Connect wallet'
                : wrongChain
                ? 'Wrong network (Arc Testnet)'
                : 'Arc Testnet'
            }
            ok={networkOk}
          />

          <FeePill
            creationFee={creationFee}
            disputeFee={disputeFee}
            feeErr={feeErr}
          />
        </div>
      </div>
    </Card>
  )
}
