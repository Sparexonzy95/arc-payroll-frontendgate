// src/features/escrow/components/CreateEscrowCard.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { formatUnits, isAddress, parseUnits, zeroAddress } from 'viem'
import { Card } from '../../../components/ui/Card'
import { ARC_CHAIN_ID } from '../../../lib/config'
import {
  arcflowEscrowAbi,
  ARCFLOW_ARBITER_WALLET,
  ARCFLOW_ESCROW_ADDRESS,
} from '../escrow.contract'
import { ingestEscrowTx } from '../escrow.http'
import { prettyErr, shortAddr, termsHashFromText } from '../utils/hashing'
import {
  IconAlertTriangle,
  IconCopy,
  IconFileText,
  IconLock,
  IconPlus,
  IconShieldCheck,
  IconUser,
  IconCoin,
  IconClock,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
} from '@tabler/icons-react'

// ✅ Token SVGs
import usdcSvg from '../../../assets/tokens/usdc.svg'
import eurcSvg from '../../../assets/tokens/eurc.svg'

const NAVY = '#0E2A55'

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

function prettyFee(wei: bigint | null) {
  if (wei == null) return '—'
  try {
    const eth = Number(formatUnits(wei, 18))
    if (!Number.isFinite(eth)) return `${wei.toString()} wei`
    if (eth > 0 && eth < 0.0001) return '<0.0001 ARC'
    return `${eth.toFixed(4)} ARC`
  } catch {
    return `${wei.toString()} wei`
  }
}

function tryCopy(text: string) {
  try {
    void navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function shortHex(addr?: string, left = 6, right = 4) {
  const a = String(addr || '')
  if (!a || a.length < left + right + 2) return a
  return `${a.slice(0, left)}…${a.slice(-right)}`
}

function tokenIconFor(symbol?: string) {
  const s = String(symbol || '').toUpperCase()
  if (s === 'USDC') return usdcSvg
  if (s === 'EURC') return eurcSvg
  return null
}

type Step = 'create' | 'fund' | 'approve' | 'resolve'

export function CreateEscrowCard(props: {
  address?: string
  wrongChain: boolean
  busy: boolean
  setBusy: (v: boolean) => void
  arcTokens: any[]
  tokensReady: boolean
  arcChainDbReady: boolean
  creationFee: bigint | null
  walletClient: any
  publicClient: any
  onRefresh: () => Promise<void>
}) {
  const {
    address,
    wrongChain,
    busy,
    setBusy,
    arcTokens,
    tokensReady,
    arcChainDbReady,
    creationFee,
    walletClient,
    publicClient,
    onRefresh,
  } = props

  const [payee, setPayee] = useState('')
  const [tokenId, setTokenId] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [timeoutSeconds, setTimeoutSeconds] = useState('0')
  const [termsText, setTermsText] = useState('')

  const [showDetails, setShowDetails] = useState(false)
  const [showHash, setShowHash] = useState(false)

  const [tPayee, setTPayee] = useState(false)
  const [tAmount, setTAmount] = useState(false)
  const [tToken, setTToken] = useState(false)
  const [tTimeout, setTTimeout] = useState(false)

  // ✅ Token dropdown (custom)
  const [tokenOpen, setTokenOpen] = useState(false)
  const tokenWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const el = tokenWrapRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setTokenOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setTokenOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (tokenId !== '') return
    if (arcTokens.length > 0) setTokenId(Number(arcTokens[0].id))
  }, [arcTokens, tokenId])

  const selectedToken = useMemo(() => {
    if (tokenId === '') return null
    return arcTokens.find((t) => Number(t.id) === Number(tokenId)) ?? null
  }, [arcTokens, tokenId])

  const decimals = Number(selectedToken?.decimals ?? 6)
  const termsHash = useMemo(() => termsHashFromText(termsText.trim()), [termsText])

  const payeeOk = payee.trim().length > 0 && isAddress(payee.trim())
  const amountNum = Number(amount.trim())
  const amountOk = amount.trim().length > 0 && Number.isFinite(amountNum) && amountNum > 0
  const tokenOk = !!selectedToken
  const timeoutNum = Number(timeoutSeconds || '0')
  const timeoutOk = Number.isFinite(timeoutNum) && timeoutNum >= 0

  const missingContract = !ARCFLOW_ESCROW_ADDRESS || ARCFLOW_ESCROW_ADDRESS === zeroAddress

  const blocker =
    !address
      ? 'Connect wallet'
      : wrongChain
      ? 'Switch to Arc Testnet'
      : missingContract
      ? 'Missing escrow contract address'
      : !arcChainDbReady
      ? 'Backend not ready'
      : creationFee == null
      ? 'Loading fee'
      : null

  const createDisabled = busy || !!blocker || !tokenOk || !payeeOk || !amountOk || !timeoutOk

  const activeStep: Step = 'create'

  async function handleCreateEscrow() {
    setTPayee(true)
    setTAmount(true)
    setTToken(true)
    setTTimeout(true)

    if (blocker) return toast.error(blocker)
    if (!walletClient || !publicClient) return toast.error('Wallet not ready')
    if (!selectedToken) return toast.error('Select token')
    if (!payeeOk) return toast.error('Invalid payee')
    if (!amountOk) return toast.error('Invalid amount')
    if (!timeoutOk) return toast.error('Invalid timeout')

    let amountRaw: bigint
    try {
      amountRaw = parseUnits(amount.trim(), decimals)
    } catch {
      return toast.error('Invalid amount format')
    }

    const tid = toast.loading('Creating escrow…')
    setBusy(true)

    try {
      const txHash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'createEscrow',
        args: [
          payee.trim() as `0x${string}`,
          selectedToken.address as `0x${string}`,
          amountRaw,
          ARCFLOW_ARBITER_WALLET,
          termsHash,
          BigInt(timeoutNum) as any,
        ],
        value: creationFee as bigint,
      })

      toast.loading(`Confirming… ${shortAddr(txHash)}`, { id: tid })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      if (receipt.status !== 'success') throw new Error('Transaction failed')

      await ingestEscrowTx({
        chain_id: ARC_CHAIN_ID,
        tx_hash: txHash,
        contract_address: ARCFLOW_ESCROW_ADDRESS,
      })

      toast.success('Created', { id: tid })

      setPayee('')
      setAmount('')
      setTimeoutSeconds('0')
      setTermsText('')
      setShowHash(false)

      setTPayee(false)
      setTAmount(false)
      setTToken(false)
      setTTimeout(false)

      await onRefresh()
    } catch (e: any) {
      toast.error(prettyErr(e), { id: tid })
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const selectedIcon = tokenIconFor(selectedToken?.symbol)

  return (
    <Card className="h-full rounded-2xl border border-slate-200 bg-white p-0 shadow-sm flex flex-col">
      {/* NAVY BANNER (curved edges) */}
      <div className="p-3 sm:p-4">
        <div className="rounded-2xl px-4 py-4 sm:px-5 sm:py-5" style={{ backgroundColor: NAVY }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Create escrow</div>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                  Fee: {prettyFee(creationFee)}
                </div>

                {blocker ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-semibold text-amber-100">
                    <IconAlertTriangle size={14} stroke={1.9} />
                    <span className="truncate">{blocker}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                    Ready
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
            >
              Details {showDetails ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </button>
          </div>

          {showDetails ? (
            <div className="mt-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-xs text-white/90">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Arbiter</div>
                  <div className="font-mono">
                    {ARCFLOW_ARBITER_WALLET.slice(0, 6)}…{ARCFLOW_ARBITER_WALLET.slice(-4)}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Contract</div>
                  <div className="font-mono">
                    {String(ARCFLOW_ESCROW_ADDRESS).slice(0, 6)}…{String(ARCFLOW_ESCROW_ADDRESS).slice(-4)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 flex-1 flex flex-col">
        {/* Minimal stepper */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <StepPill title="Create" icon={IconPlus} active={activeStep === 'create'} />
          <div className="text-slate-300">→</div>
          <StepPill title="Fund" icon={IconCoin} active={false} />
          <div className="text-slate-300">→</div>
          <StepPill title="Approve" icon={IconShieldCheck} active={false} />
          <div className="text-slate-300">→</div>
          <StepPill title="Resolve" icon={IconLock} active={false} />
        </div>

        {/* Form */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Payee */}
          <label className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <IconUser size={16} stroke={1.9} style={{ color: NAVY }} />
              Payee
            </div>
            <input
              className={cn(
                'h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2',
                tPayee && !payeeOk
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-blue-200'
              )}
              placeholder="0x…"
              value={payee}
              onBlur={() => setTPayee(true)}
              onChange={(e) => setPayee(e.target.value)}
            />
            {tPayee && !payeeOk ? <div className="text-[11px] text-rose-600">Enter a valid address.</div> : null}
          </label>

          {/* Token (custom dropdown with SVG) */}
          <div className="space-y-1" ref={tokenWrapRef}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <IconCoin size={16} stroke={1.9} style={{ color: NAVY }} />
                Token
              </div>
              {selectedToken ? <div className="text-[11px] text-slate-500">{decimals} decimals</div> : null}
            </div>

            <button
              type="button"
              disabled={!tokensReady}
              onBlur={() => setTToken(true)}
              onClick={() => {
                if (!tokensReady) return
                setTokenOpen((v) => !v)
              }}
              className={cn(
                'h-11 w-full rounded-xl border bg-white px-3 text-left text-sm outline-none focus:ring-2',
                'flex items-center justify-between gap-3',
                tToken && !tokenOk
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-blue-200',
                !tokensReady && 'opacity-70 cursor-not-allowed'
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                {selectedToken ? (
                  <>
                    {selectedIcon ? (
                      <img
                        src={selectedIcon}
                        alt={String(selectedToken.symbol)}
                        className="h-5 w-5 rounded-full"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-slate-200" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">
                        {String(selectedToken.symbol)}
                      </div>
                      <div className="truncate text-[11px] text-slate-500">
                        {shortHex(String(selectedToken.address))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500">{!tokensReady ? 'Loading…' : 'Select token'}</div>
                )}
              </div>

              <IconChevronDown size={18} stroke={1.9} className={cn(tokenOpen && 'rotate-180')} />
            </button>

            {tokenOpen ? (
              <div className="relative">
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                  <div className="max-h-64 overflow-auto p-1">
                    {arcTokens.map((t: any) => {
                      const active = selectedToken && Number(t.id) === Number(selectedToken.id)
                      const icon = tokenIconFor(t.symbol)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTokenId(Number(t.id))
                            setTokenOpen(false)
                            setTToken(true)
                          }}
                          className={cn(
                            'w-full rounded-xl px-3 py-2 text-left hover:bg-slate-50',
                            'flex items-center justify-between gap-3',
                            active && 'bg-slate-50'
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {icon ? (
                              <img src={icon} alt={String(t.symbol)} className="h-5 w-5 rounded-full" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-slate-200" />
                            )}
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {String(t.symbol)}
                              </div>
                              <div className="truncate text-[11px] text-slate-500">
                                {shortHex(String(t.address))}
                              </div>
                            </div>
                          </div>

                          {active ? (
                            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                              <IconCheck size={16} stroke={2} />
                            </div>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {tToken && !tokenOk ? <div className="text-[11px] text-rose-600">Select a token.</div> : null}
          </div>

          {/* Amount */}
          <label className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <IconCoin size={16} stroke={1.9} style={{ color: NAVY }} />
              Amount
            </div>
            <input
              className={cn(
                'h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2',
                tAmount && !amountOk
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-blue-200'
              )}
              placeholder="0.00"
              value={amount}
              onBlur={() => setTAmount(true)}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
            />
            {tAmount && !amountOk ? (
              <div className="text-[11px] text-rose-600">Enter an amount greater than 0.</div>
            ) : null}
          </label>

          {/* Timeout */}
          <label className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <IconClock size={16} stroke={1.9} style={{ color: NAVY }} />
              Timeout (sec)
            </div>
            <input
              className={cn(
                'h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2',
                tTimeout && !timeoutOk
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-blue-200'
              )}
              placeholder="0"
              value={timeoutSeconds}
              onBlur={() => setTTimeout(true)}
              onChange={(e) => setTimeoutSeconds(e.target.value)}
              inputMode="numeric"
            />
            {tTimeout && !timeoutOk ? <div className="text-[11px] text-rose-600">Must be 0 or greater.</div> : null}
          </label>

          {/* Terms */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <IconFileText size={16} stroke={1.9} style={{ color: NAVY }} />
                Terms
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHash((v) => !v)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {showHash ? 'Hide hash' : 'Show hash'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ok = tryCopy(termsHash)
                    ok ? toast.success('Copied') : toast.error('Copy failed')
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <IconCopy size={14} stroke={1.9} />
                  Copy
                </button>
              </div>
            </div>

            <textarea
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Milestones, delivery terms, acceptance notes…"
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
            />

            {showHash ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600 break-all">
                <span className="font-semibold text-slate-700">termsHash:</span>{' '}
                <span className="font-mono">{termsHash}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* CTA pinned to bottom */}
        <div className="mt-auto pt-5">
          <button
            onClick={handleCreateEscrow}
            disabled={createDisabled}
            className={cn(
              'h-12 w-full rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            style={{ backgroundColor: NAVY }}
          >
            {busy ? 'Creating…' : 'Create escrow'}
          </button>

          <div className="mt-2 text-[11px] text-slate-500">Next: fund it from the list.</div>
        </div>
      </div>
    </Card>
  )
}

function StepPill({
  title,
  icon: Icon,
  active,
}: {
  title: string
  icon: any
  active: boolean
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold',
        active ? 'border border-slate-200 bg-white shadow-sm' : 'text-slate-600'
      )}
      style={active ? { color: NAVY } : undefined}
    >
      <Icon size={16} stroke={1.9} style={active ? { color: NAVY } : undefined} />
      <span>{title}</span>
    </div>
  )
}
