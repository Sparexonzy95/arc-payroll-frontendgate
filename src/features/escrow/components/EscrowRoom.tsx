// src/features/escrow/components/EscrowRoom.tsx
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { zeroAddress } from 'viem'
import { Card } from '../../../components/ui/Card'
import { shortAddr } from '../utils/hashing'
import { readOnchainEscrow } from '../utils/onchain'
import { arcflowEscrowAbi, ARCFLOW_ESCROW_ADDRESS, erc20Abi } from '../escrow.contract'
import { EscrowTimeline } from './EscrowTimeline'
import { EscrowChatPanel } from './EscrowChatPanel'
import { EscrowEvidencePanel } from './EscrowEvidencePanel'
import {
  IconArrowLeft,
  IconReload,
  IconMessageCircle2,
  IconShieldLock,
  IconBolt,
  IconDotsVertical,
  IconCheck,
} from '@tabler/icons-react'

const NAVY = '#0E2A55'
const BG = '#F6F8FC'

function statusLabel(onchainStatus: number | null, disputed: boolean) {
  if (disputed) return 'DISPUTED'
  if (onchainStatus === 0) return 'AWAITING DEPOSIT'
  if (onchainStatus === 1) return 'FUNDED'
  if (onchainStatus === 2) return 'RELEASED'
  if (onchainStatus === 3) return 'REFUNDED'
  return 'UNKNOWN'
}

function StatusPill({ label }: { label: string }) {
  const tone =
    label === 'RELEASED' || label === 'REFUNDED'
      ? 'success'
      : label === 'DISPUTED'
      ? 'danger'
      : label === 'FUNDED'
      ? 'info'
      : 'neutral'

  const cls =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : tone === 'info'
      ? 'border-sky-200 bg-sky-50 text-sky-800'
      : 'border-slate-200 bg-white text-slate-700'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}

async function ensureAllowanceAndApprove(args: {
  walletClient: any
  publicClient: any
  token: `0x${string}`
  owner: `0x${string}`
  spender: `0x${string}`
  amount: bigint
}) {
  const { walletClient, publicClient, token, owner, spender, amount } = args

  const allowance = (await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  })) as bigint

  if (allowance >= amount) return

  const tx = await walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, amount],
  })
  await publicClient.waitForTransactionReceipt({ hash: tx })
}

export function EscrowRoom(props: {
  open: boolean
  onClose: () => void
  escrow: any | null
  address?: string
  chainId?: number
  walletClient: any
  publicClient: any
  arcTokens: any[]
}) {
  const { open, onClose, escrow, address, walletClient, publicClient, arcTokens } = props

  // ✅ Back routing: always return to Escrow tab, not dashboard default (Payroll)
 const nav = useNavigate()
const backTo = '/dashboard?tab=escrow'

  const [tab, setTab] = useState<'chat' | 'evidence'>('chat')
  const [busy, setBusy] = useState(false)

  const escrowPk = Number(escrow?.id ?? 0)
  const escrowId = BigInt(Number(escrow?.escrow_id ?? 0))

  const onchainQ = useQuery({
    queryKey: ['room-onchain-escrow', String(escrowId)],
    queryFn: () => readOnchainEscrow(publicClient, escrowId),
    enabled: open && !!publicClient && escrowPk > 0 && Number(escrow?.escrow_id ?? 0) > 0,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  })

  const onchain = onchainQ.data ?? null

  const tokenMeta = useMemo(() => {
    const t = arcTokens?.find((x: any) => Number(x.id) === Number(escrow?.token)) ?? null
    return t
  }, [arcTokens, escrow?.token])

  const status = onchain ? onchain.status : null
  const disputed = onchain ? onchain.disputed : !!escrow?.disputed
  const label = statusLabel(status, disputed)

  const isPayer = !!address && !!onchain && onchain.payer?.toLowerCase() === address.toLowerCase()
  const isPayee = !!address && !!onchain && onchain.payee?.toLowerCase() === address.toLowerCase()
  const isParty = isPayer || isPayee

  const canSubmitEvidence = !!onchain && onchain.status === 1 && isParty

  const canFund = !!onchain && onchain.status === 0 && isPayer
  const canApprove = !!onchain && onchain.status === 1 && !onchain.disputed && isParty
 const chainFunded = onchain?.status === 1
const dbFunded = escrow?.status === 'FUNDED'

const canDispute =
  isParty &&
  !onchain?.disputed &&
  (chainFunded || dbFunded)

  const readyRelease =
    !!onchain &&
    onchain.status === 1 &&
    !onchain.disputed &&
    onchain.payerApprovedRelease &&
    onchain.payeeApprovedRelease

  const readyRefund =
    !!onchain &&
    onchain.status === 1 &&
    !onchain.disputed &&
    onchain.payerApprovedRefund &&
    onchain.payeeApprovedRefund

  async function runTx(fn: () => Promise<void>, label: string) {
    if (busy) return
    setBusy(true)
    const tid = toast.loading(label)
    try {
      await fn()
      toast.success('Done ✅', { id: tid })
      await onchainQ.refetch()
    } catch (e: any) {
      toast.error(String(e?.message ?? e), { id: tid })
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  async function fund() {
    if (!walletClient || !publicClient) throw new Error('Wallet not ready')
    if (!ARCFLOW_ESCROW_ADDRESS || ARCFLOW_ESCROW_ADDRESS === zeroAddress) {
      throw new Error('Missing VITE_ARCFLOW_ESCROW_ADDRESS')
    }
    if (!onchain) throw new Error('On-chain escrow not loaded')

    const amount = BigInt(onchain.amount)

    await ensureAllowanceAndApprove({
      walletClient,
      publicClient,
      token: onchain.token,
      owner: (address as `0x${string}`) || zeroAddress,
      spender: ARCFLOW_ESCROW_ADDRESS,
      amount,
    })

    const tx = await walletClient.writeContract({
      address: ARCFLOW_ESCROW_ADDRESS,
      abi: arcflowEscrowAbi,
      functionName: 'deposit',
      args: [escrowId],
    })
    await publicClient.waitForTransactionReceipt({ hash: tx })
  }

  async function approveRelease() {
    const tx = await walletClient.writeContract({
      address: ARCFLOW_ESCROW_ADDRESS,
      abi: arcflowEscrowAbi,
      functionName: 'approveRelease',
      args: [escrowId],
    })
    await publicClient.waitForTransactionReceipt({ hash: tx })
  }

  async function approveRefund() {
    const tx = await walletClient.writeContract({
      address: ARCFLOW_ESCROW_ADDRESS,
      abi: arcflowEscrowAbi,
      functionName: 'approveRefund',
      args: [escrowId],
    })
    await publicClient.waitForTransactionReceipt({ hash: tx })
  }

  async function executeRelease() {
    const tx = await walletClient.writeContract({
      address: ARCFLOW_ESCROW_ADDRESS,
      abi: arcflowEscrowAbi,
      functionName: 'executeRelease',
      args: [escrowId],
    })
    await publicClient.waitForTransactionReceipt({ hash: tx })
  }

  async function executeRefund() {
    const tx = await walletClient.writeContract({
      address: ARCFLOW_ESCROW_ADDRESS,
      abi: arcflowEscrowAbi,
      functionName: 'executeRefund',
      args: [escrowId],
    })
    await publicClient.waitForTransactionReceipt({ hash: tx })
  }

  async function dispute(disputeFee: bigint) {
    const tx = await walletClient.writeContract({
      address: ARCFLOW_ESCROW_ADDRESS,
      abi: arcflowEscrowAbi,
      functionName: 'dispute',
      args: [escrowId],
      value: disputeFee,
    })
    await publicClient.waitForTransactionReceipt({ hash: tx })
  }

  function handleBack() {
    // close modal + route back to escrow tab
    try {
      onClose()
    } finally {
      nav(backTo, { replace: true })
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleBack} />
      <div className="absolute inset-0 p-3 sm:p-5">
        <div className="mx-auto flex h-[92vh] max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          {/* Top banner (compact) */}
          <div className="relative overflow-hidden px-4 py-3 sm:px-5" style={{ backgroundColor: NAVY }}>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
            <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-14 h-44 w-44 rounded-full bg-white/8 blur-3xl" />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/12 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
                >
                  <IconArrowLeft size={16} stroke={1.9} />
                  Back
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-white">
                      Escrow #{escrow?.escrow_id ?? '—'}
                    </div>
                    <span className="rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-semibold text-white/90 ring-1 ring-white/15">
                      {label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/75">
                    Payer {shortAddr(escrow?.payer_wallet)} • Payee {shortAddr(escrow?.payee_wallet)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onchainQ.refetch()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/12 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
                >
                  <IconReload size={16} stroke={1.9} />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setTab((t) => (t === 'chat' ? 'evidence' : 'chat'))}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/12 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
                >
                  <IconDotsVertical size={16} stroke={1.9} />
                  {tab === 'chat' ? 'Evidence' : 'Chat'}
                </button>
              </div>
            </div>

            {/* Small summary row */}
            <div className="relative mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/15">
                <div className="text-[10px] font-semibold text-white/70">Token</div>
                <div className="text-xs font-semibold text-white">{tokenMeta?.symbol ?? '—'}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/15">
                <div className="text-[10px] font-semibold text-white/70">Amount (raw)</div>
                <div className="text-xs font-semibold text-white">{escrow?.amount_raw ?? '—'}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/15">
                <div className="text-[10px] font-semibold text-white/70">Payee</div>
                <div className="text-xs font-semibold text-white">{shortAddr(escrow?.payee_wallet)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/15">
                <div className="text-[10px] font-semibold text-white/70">Arbiter</div>
                <div className="text-xs font-semibold text-white">{shortAddr(escrow?.arbiter_wallet)}</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-auto" style={{ backgroundColor: BG }}>
            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-12">
              {/* Left: execution + timeline */}
              <div className="lg:col-span-7 space-y-4">
                <Card className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                                      {isParty && (
                      <div className="mt-1 text-[11px] text-slate-600">
                        You are a party to this escrow
                      </div>
                    )}   
                    <div className="flex items-center gap-2">
                      <IconBolt size={16} stroke={1.9} style={{ color: NAVY }} />
                      <div className="text-sm font-semibold text-slate-900">Execution</div>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {readyRelease
                        ? 'Ready: execute release'
                        : readyRefund
                        ? 'Ready: execute refund'
                        : disputed
                        ? 'Disputed: waiting arbiter'
                        : 'Next: approvals'}
                    </div>
                  </div>
<div className="mt-3 space-y-3">
  {/* Primary actions */}
  <div className="flex flex-wrap gap-2">
    <button
      disabled={!canFund || busy}
      onClick={() => runTx(fund, 'Depositing funds…')}
      className="rounded-2xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      style={{ backgroundColor: NAVY }}
    >
      Deposit (fund)
    </button>

    <button
      disabled={!canApprove || busy}
      onClick={() => runTx(approveRelease, 'Approving release…')}
      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 disabled:opacity-50"
    >
      Approve release
    </button>

    <button
      disabled={!canApprove || busy}
      onClick={() => runTx(approveRefund, 'Approving refund…')}
      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 disabled:opacity-50"
    >
      Approve refund
    </button>

    <button
      disabled={!readyRelease || busy}
      onClick={() => runTx(executeRelease, 'Executing release…')}
      className="rounded-2xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      style={{ backgroundColor: NAVY }}
    >
      Execute release
    </button>

    <button
      disabled={!readyRefund || busy}
      onClick={() => runTx(executeRefund, 'Executing refund…')}
      className="rounded-2xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      style={{ backgroundColor: NAVY }}
    >
      Execute refund
    </button>
  </div>

  {/* Divider */}
  <div className="border-t border-slate-200" />

 {/* Escalation */}
<div className="flex flex-wrap gap-2">
  <button
    disabled={!canDispute || busy}
    onClick={() =>
      runTx(
        async () => {
          // 🔐 HARD CHAIN GUARD (CRITICAL)
          if (!onchain || onchain.status !== 1) {
            toast.error('Escrow not yet funded on-chain')
            return
          }

          const fee = (await publicClient.readContract({
            address: ARCFLOW_ESCROW_ADDRESS,
            abi: arcflowEscrowAbi,
            functionName: 'disputeFee',
            args: [],
          })) as bigint

          await dispute(fee)
        },
        'Opening dispute…'
      )
    }
    className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 disabled:opacity-50"
  >
    Dispute
  </button>
</div>

</div>

                  {!address ? (
                    <div className="mt-2 text-[11px] text-slate-600">Connect wallet to interact.</div>
                  ) : null}
                </Card>

                <Card className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">Progress</div>
                    <StatusPill label={label} />
                  </div>
                  <div className="mt-3">
                    <EscrowTimeline dbEscrow={escrow} onchain={onchain} />
                  </div>
                </Card>
              </div>

              {/* Right: tabs (chat/evidence) */}
              <div className="lg:col-span-5">
                <Card className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTab('chat')}
                      className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold ${
                        tab === 'chat' ? 'text-white' : 'border border-slate-200 bg-white text-slate-900'
                      }`}
                      style={tab === 'chat' ? { backgroundColor: NAVY } : undefined}
                    >
                      <IconMessageCircle2 size={16} stroke={1.9} />
                      Chat
                    </button>

                    <button
                      type="button"
                      onClick={() => setTab('evidence')}
                      className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold ${
                        tab === 'evidence' ? 'text-white' : 'border border-slate-200 bg-white text-slate-900'
                      }`}
                      style={tab === 'evidence' ? { backgroundColor: NAVY } : undefined}
                    >
                      <IconShieldLock size={16} stroke={1.9} />
                      Evidence
                    </button>
                  </div>

                  <div className="mt-3 h-[62vh] min-h-0">
                    {tab === 'chat' ? (
                      <EscrowChatPanel escrowPk={escrowPk} address={address} />
                    ) : (
                      <EscrowEvidencePanel
                        escrowPk={escrowPk}
                        escrowId={escrowId}
                        address={address}
                        canSubmit={canSubmitEvidence}
                        busy={busy}
                        setBusy={setBusy}
                        walletClient={walletClient}
                        publicClient={publicClient}
                      />
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* bottom safe area */}
          <div className="border-t border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-600">
            Tip: use Evidence for disputes, Chat for coordination.
          </div>
        </div>
      </div>
    </div>
  )
}
