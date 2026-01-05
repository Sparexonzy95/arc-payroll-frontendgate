// src/features/escrow/components/EscrowTimeline.tsx
import type { OnchainEscrow } from '../utils/onchain'
import {
  IconCircleCheckFilled,
  IconCircleDotted,
  IconClock,
  IconLock,
  IconArrowUpRight,
  IconArrowBackUp,
  IconAlertTriangle,
  IconScale,
} from '@tabler/icons-react'

const NAVY = '#0E2A55'

type Tone = 'done' | 'active' | 'idle' | 'danger'

function toneStyles(tone: Tone) {
  if (tone === 'done') {
    return {
      dot: 'bg-emerald-500',
      ring: 'ring-emerald-200',
      title: 'text-slate-900',
      meta: 'text-slate-600',
      icon: 'text-emerald-600',
      line: 'bg-emerald-200',
    }
  }
  if (tone === 'danger') {
    return {
      dot: 'bg-rose-500',
      ring: 'ring-rose-200',
      title: 'text-slate-900',
      meta: 'text-rose-700',
      icon: 'text-rose-600',
      line: 'bg-rose-200',
    }
  }
  if (tone === 'active') {
    return {
      dot: '',
      ring: 'ring-blue-200',
      title: 'text-slate-900',
      meta: 'text-slate-600',
      icon: '',
      line: 'bg-slate-200',
    }
  }
  return {
    dot: 'bg-slate-300',
    ring: 'ring-slate-200',
    title: 'text-slate-700',
    meta: 'text-slate-500',
    icon: 'text-slate-500',
    line: 'bg-slate-200',
  }
}

function Step(props: {
  done: boolean
  active: boolean
  danger?: boolean
  title: string
  meta?: string
  icon?: any
  last?: boolean
}) {
  const { done, active, danger, title, meta, icon: Icon, last } = props

  const tone: Tone = danger ? 'danger' : done ? 'done' : active ? 'active' : 'idle'
  const s = toneStyles(tone)

  const DotIcon = done ? IconCircleCheckFilled : active ? IconCircleDotted : IconClock
  const iconColor = done ? undefined : active ? { color: NAVY } : undefined

  return (
    <div className="flex gap-3">
      {/* Left rail */}
      <div className="flex flex-col items-center">
        <div className={`grid h-8 w-8 place-items-center rounded-full ring-4 ${s.ring} bg-white`}>
          <DotIcon size={16} stroke={1.9} className={done ? s.icon : active ? '' : s.icon} style={iconColor} />
        </div>
        {!last && <div className={`mt-2 h-full w-0.5 ${s.line}`} />}
      </div>

      {/* Content */}
      <div className="min-w-0 pb-4">
        <div className={`text-sm font-semibold ${s.title}`}>{title}</div>
        {meta ? <div className={`mt-0.5 text-xs ${s.meta}`}>{meta}</div> : null}

        {Icon ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
            <Icon size={16} stroke={1.9} style={{ color: NAVY }} />
            <span className="text-[11px] font-semibold text-slate-700">
              {done ? 'Done' : active ? 'In progress' : 'Pending'}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function EscrowTimeline(props: { dbEscrow: any; onchain: OnchainEscrow | null }) {
  const { dbEscrow, onchain } = props

  const disputed = onchain ? onchain.disputed : !!dbEscrow.disputed
  const status = onchain ? onchain.status : null

  const createdDone = true
  const fundedDone = status === 1 || status === 2 || status === 3

  const relA = !!onchain && onchain.payerApprovedRelease
  const relB = !!onchain && onchain.payeeApprovedRelease
  const refA = !!onchain && onchain.payerApprovedRefund
  const refB = !!onchain && onchain.payeeApprovedRefund

  const releasedDone = status === 2
  const refundedDone = status === 3

  const readyRelease = fundedDone && relA && relB && !disputed && !releasedDone && !refundedDone
  const readyRefund = fundedDone && refA && refB && !disputed && !releasedDone && !refundedDone

  // “what matters now” helper copy
  const nextHint =
    disputed
      ? 'This escrow is disputed. Arbiter must resolve.'
      : !fundedDone
      ? 'Next: fund the escrow to lock tokens in the contract.'
      : readyRelease
      ? 'Next: execute release to send funds to the payee.'
      : readyRefund
      ? 'Next: execute refund to return funds to the payer.'
      : releasedDone
      ? 'Completed: funds released.'
      : refundedDone
      ? 'Completed: funds refunded.'
      : 'Next: both parties approve release (or approve refund).'

  return (
    <div className="space-y-3">
      {/* Small helper banner */}
      <div className="rounded-2xl border border-slate-200 bg-[#F6F8FC] px-3 py-2">
        <div className="text-[11px] font-semibold text-slate-600">Next step</div>
        <div className="text-xs font-semibold text-slate-900">{nextHint}</div>
      </div>

      <div className="space-y-1">
        <Step
          done={createdDone}
          active={!fundedDone}
          title="Escrow created"
          meta="Escrow room opened"
          icon={IconScale}
        />

        <Step
          done={fundedDone}
          active={!fundedDone && status !== null}
          title="Funds deposited (locked)"
          meta="Tokens are held by the escrow contract"
          icon={IconLock}
        />

        {/* Approvals */}
        <div className="pt-1 text-[11px] font-semibold text-slate-600">Approvals</div>

        <Step
          done={relA}
          active={fundedDone && !relA && !disputed}
          title="Payer approved release"
          meta={relA ? 'Approved' : fundedDone ? 'Waiting for payer' : 'Locked after funding'}
          icon={IconArrowUpRight}
        />

        <Step
          done={relB}
          active={fundedDone && relA && !relB && !disputed}
          title="Payee approved release"
          meta={relB ? 'Approved' : fundedDone ? 'Waiting for payee' : 'Locked after funding'}
          icon={IconArrowUpRight}
        />

        <Step
          done={refA}
          active={fundedDone && !refA && !disputed && !readyRelease}
          title="Payer approved refund"
          meta={refA ? 'Approved' : fundedDone ? 'Optional, can be used for refund path' : 'Locked after funding'}
          icon={IconArrowBackUp}
        />

        <Step
          done={refB}
          active={fundedDone && refA && !refB && !disputed && !readyRelease}
          title="Payee approved refund"
          meta={refB ? 'Approved' : fundedDone ? 'Optional, completes refund path' : 'Locked after funding'}
          icon={IconArrowBackUp}
        />

        {/* Terminal / decision */}
        {disputed ? (
          <Step
            done={true}
            active={true}
            danger
            title="Disputed"
            meta="Waiting for arbiter resolution"
            icon={IconAlertTriangle}
            last
          />
        ) : readyRelease ? (
          <Step
            done={false}
            active={true}
            title="Execute release"
            meta="Final step: transfer to payee"
            icon={IconArrowUpRight}
            last
          />
        ) : readyRefund ? (
          <Step
            done={false}
            active={true}
            title="Execute refund"
            meta="Final step: transfer back to payer"
            icon={IconArrowBackUp}
            last
          />
        ) : releasedDone ? (
          <Step
            done={true}
            active={false}
            title="Funds released"
            meta="Payee has received funds"
            icon={IconCircleCheckFilled}
            last
          />
        ) : refundedDone ? (
          <Step
            done={true}
            active={false}
            title="Funds refunded"
            meta="Payer has received funds back"
            icon={IconCircleCheckFilled}
            last
          />
        ) : (
          <Step
            done={false}
            active={false}
            title="Awaiting next action"
            meta="Approvals or dispute will determine the final path"
            icon={IconClock}
            last
          />
        )}
      </div>
    </div>
  )
}
