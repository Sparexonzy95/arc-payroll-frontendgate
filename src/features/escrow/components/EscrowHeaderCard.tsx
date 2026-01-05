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
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100"
        style={{ color: NAVY }}
      >
        <Icon size={18} stroke={1.9} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="mt-0.5 text-sm font-semibold text-slate-900 break-all">
          {value}
        </div>
      </div>
      {ok !== undefined ? (
        <div className="ml-auto">
          {ok ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <IconCircleCheckFilled size={14} />
              OK
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
              Check
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}

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
            return `${formatUnits(creationFee, 18)} (native)`
          } catch {
            return `${creationFee.toString()} (raw)`
          }
        })()

  const dispute =
    disputeFee == null
      ? '—'
      : (() => {
          try {
            return `${formatUnits(disputeFee, 18)} (native)`
          } catch {
            return `${disputeFee.toString()} (raw)`
          }
        })()

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100"
          style={{ color: NAVY }}
        >
          <IconScale size={18} stroke={1.9} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Fees
          </div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">
            {feeErr ? <span className="text-rose-600">{feeErr}</span> : creation}
          </div>
          <div className="mt-1 text-[12px] text-slate-500">
            Dispute fee: {feeErr ? '—' : dispute}
          </div>
        </div>
      </div>
    </div>
  )
}

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
    <Card className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
      {/* NAVY BANNER */}
      <div
        className="relative rounded-3xl px-6 py-8 sm:px-8 sm:py-10"
        style={{ backgroundColor: NAVY }}
      >
        {/* subtle depth */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-black/10" />

        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white">
            <IconShieldCheck size={34} stroke={1.9} />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-white">
              Escrow
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/80">
              Set up on-chain escrows to secure milestone-based payouts for grants,
              vendors, and bounty recipients. All escrows use a neutral on-chain
              arbiter for dispute resolution.
            </p>
          </div>
        </div>
      </div>

      {/* INFO STRIP */}
      <div className="bg-[#F6F8FC] p-4 sm:p-5">
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
