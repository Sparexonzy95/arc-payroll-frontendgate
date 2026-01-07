// src/features/escrow/components/EscrowActions.tsx
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { zeroAddress } from 'viem'
import {
  arcflowEscrowAbi,
  ARCFLOW_ESCROW_ADDRESS,
  erc20Abi,
  ARCFLOW_ARBITER_WALLET,
} from '../escrow.contract'
import { syncEscrow, createEvidence, createDispute } from '../escrow.api'
import { prettyErr, shortAddr, termsHashFromText } from '../utils/hashing'
import type { OnchainEscrow } from '../utils/onchain'

type Primary = { label: string; onClick: () => void; disabled?: boolean; tone?: 'primary' | 'danger' | 'ghost' }

function btnClass(tone: Primary['tone']) {
  if (tone === 'danger') {
    return 'bg-rose-600 text-white hover:bg-rose-700'
  }

  if (tone === 'ghost') {
    return 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
  }

  // primary
  return 'text-white'
}


export function EscrowActions(props: {
  e: any
  onchain: OnchainEscrow | null
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
  const {
    e,
    onchain,
    address,
    wrongChain,
    tokensReady,
    arcTokens,
    disputeFee,
    busy,
    setBusy,
    walletClient,
    publicClient,
    onRefresh,
  } = props

  const [showMore, setShowMore] = useState(false)

  const isArbiter = !!address && address.toLowerCase() === ARCFLOW_ARBITER_WALLET.toLowerCase()
  const iAmPayer = !!address && String(e.payer_wallet || '').toLowerCase() === address.toLowerCase()
  const iAmPayee = !!address && String(e.payee_wallet || '').toLowerCase() === address.toLowerCase()

  function escrowIdBig(): bigint {
    return BigInt(Number(e.escrow_id))
  }

  const dbStatus = String(e.status || '').toUpperCase()

  const fundedOnchain = onchain ? onchain.status === 1 : dbStatus === 'FUNDED'
  const disputedOnchain = onchain ? onchain.disputed : !!e.disputed
  const releasedOnchain = onchain ? onchain.status === 2 : false
  const refundedOnchain = onchain ? onchain.status === 3 : false

  const canApprove = fundedOnchain && !disputedOnchain && (iAmPayer || iAmPayee)
  const canDispute = fundedOnchain && !disputedOnchain && (iAmPayer || iAmPayee)

  const canExecuteRelease =
    fundedOnchain &&
    !disputedOnchain &&
    !!onchain &&
    onchain.payerApprovedRelease &&
    onchain.payeeApprovedRelease

  const canExecuteRefund =
    fundedOnchain &&
    !disputedOnchain &&
    !!onchain &&
    onchain.payerApprovedRefund &&
    onchain.payeeApprovedRefund

  const nowSec = Math.floor(Date.now() / 1000)
  const timeoutEnabled = !!onchain && onchain.timeoutSeconds > 0
  const timeoutAt = timeoutEnabled ? onchain!.fundedAt + onchain!.timeoutSeconds : 0

  const canTimeoutRefund =
    fundedOnchain &&
    !disputedOnchain &&
    iAmPayer &&
    timeoutEnabled &&
    nowSec >= timeoutAt

  const actionBlockedReason = useMemo(() => {
    if (!address) return 'Connect wallet'
    if (wrongChain) return 'Switch to Arc Testnet'
    if (!walletClient || !publicClient) return 'Wallet not ready'
    return null
  }, [address, wrongChain, walletClient, publicClient])

  async function ensureAllowance(tokenAddr: `0x${string}`, spender: `0x${string}`, amountRaw: bigint) {
    if (!address || !publicClient || !walletClient) throw new Error('Wallet not ready')

    const allowance = (await publicClient.readContract({
      address: tokenAddr,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, spender],
    })) as bigint

    if (allowance >= amountRaw) return

    const tid = toast.loading('Approving token…')
    try {
      const hash = await walletClient.writeContract({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amountRaw],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      toast.success('Approved ✅', { id: tid })
    } catch (e: any) {
      toast.error(prettyErr(e), { id: tid })
      throw e
    }
  }

  async function safeSync() {
    try {
      await syncEscrow(Number(e.id))
    } catch {
      // ignore
    }
  }

  async function handleFundEscrow() {
    if (actionBlockedReason) return toast.error(actionBlockedReason)
    if (!tokensReady) return toast.error('Tokens not loaded yet')
    if (!iAmPayer) return toast.error('Only payer can fund this escrow')

    if (!ARCFLOW_ESCROW_ADDRESS || ARCFLOW_ESCROW_ADDRESS === zeroAddress) {
      return toast.error('Escrow contract address not set (VITE_ARCFLOW_ESCROW_ADDRESS)')
    }

    const tokenIdFromRow = Number(e?.token)
    const tokenMeta = arcTokens.find((t: any) => Number(t.id) === tokenIdFromRow)
    if (!tokenMeta?.address) return toast.error('Token metadata not found (token id mismatch)')

    let amountRaw: bigint
    try {
      amountRaw = BigInt(String(e?.amount_raw))
    } catch {
      return toast.error('Invalid amount_raw from backend')
    }

    setBusy(true)
    const tid = toast.loading(`Funding escrow #${e.escrow_id}…`)
    try {
      await ensureAllowance(tokenMeta.address as `0x${string}`, ARCFLOW_ESCROW_ADDRESS, amountRaw)

      const hash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'deposit',
        args: [escrowIdBig()],
      })

      toast.loading(`Confirming deposit… ${shortAddr(hash)}`, { id: tid })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status !== 'success') throw new Error('Deposit failed')

      await safeSync()
      toast.success(`Escrow #${e.escrow_id} funded ✅`, { id: tid })
      await onRefresh()
    } catch (err: any) {
      toast.error(prettyErr(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  async function handleApproveRelease() {
    if (actionBlockedReason) return toast.error(actionBlockedReason)
    if (!canApprove) return toast.error('Not allowed')

    const tid = toast.loading('Approving release…')
    setBusy(true)
    try {
      const hash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'approveRelease',
        args: [escrowIdBig()],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await safeSync()
      toast.success('Approved release ✅', { id: tid })
      await onRefresh()
    } catch (err: any) {
      toast.error(prettyErr(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  async function handleApproveRefund() {
    if (actionBlockedReason) return toast.error(actionBlockedReason)
    if (!canApprove) return toast.error('Not allowed')

    const tid = toast.loading('Approving refund…')
    setBusy(true)
    try {
      const hash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'approveRefund',
        args: [escrowIdBig()],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await safeSync()
      toast.success('Approved refund ✅', { id: tid })
      await onRefresh()
    } catch (err: any) {
      toast.error(prettyErr(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  async function handleExecuteRelease() {
    if (actionBlockedReason) return toast.error(actionBlockedReason)
    if (!canExecuteRelease) return toast.error('Need both release approvals')

    const tid = toast.loading('Executing release…')
    setBusy(true)
    try {
      const hash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'executeRelease',
        args: [escrowIdBig()],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await safeSync()
      toast.success('Released ✅', { id: tid })
      await onRefresh()
    } catch (err: any) {
      toast.error(prettyErr(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  async function handleExecuteRefund() {
    if (actionBlockedReason) return toast.error(actionBlockedReason)
    if (!canExecuteRefund) return toast.error('Need both refund approvals')

    const tid = toast.loading('Executing refund…')
    setBusy(true)
    try {
      const hash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'executeRefund',
        args: [escrowIdBig()],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await safeSync()
      toast.success('Refunded ✅', { id: tid })
      await onRefresh()
    } catch (err: any) {
      toast.error(prettyErr(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  async function handleTimeoutRefund() {
    if (actionBlockedReason) return toast.error(actionBlockedReason)
    if (!canTimeoutRefund) return toast.error('Timeout not reached / not allowed')

    const tid = toast.loading('Timeout refund…')
    setBusy(true)
    try {
      const hash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'timeoutRefund',
        args: [escrowIdBig()],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await safeSync()
      toast.success('Timeout refunded ✅', { id: tid })
      await onRefresh()
    } catch (err: any) {
      toast.error(prettyErr(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  async function handleDispute() {
    if (actionBlockedReason) return toast.error(actionBlockedReason)
    if (!canDispute) return toast.error('Not allowed')
    if (!disputeFee) return toast.error('Dispute fee not loaded')

    const tid = toast.loading('Opening dispute…')
    setBusy(true)
    try {
      await createDispute({ escrow: Number(e.id), opened_by_wallet: address! }).catch(() => {})

      const hash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'dispute',
        args: [escrowIdBig()],
        value: disputeFee,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await safeSync()

      toast.success('Disputed ✅', { id: tid })
      await onRefresh()
    } catch (err: any) {
      toast.error(prettyErr(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmitEvidence() {
    if (actionBlockedReason) return toast.error(actionBlockedReason)
    if (!(iAmPayer || iAmPayee) || !fundedOnchain) return toast.error('Not allowed')

    const note = prompt('Evidence note (short). Saved off-chain then hashed on-chain.')
    if (!note) return

    const tid = toast.loading('Saving evidence…')
    setBusy(true)
    try {
      const ev = await createEvidence({
        escrow: Number(e.id),
        submitted_by_wallet: address!,
        bundle: { note, ts: Date.now() },
        files: [],
      })

      const evidenceHash = ev.evidence_hash as `0x${string}`

      toast.loading('Submitting evidence on-chain…', { id: tid })
      const txHash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'submitEvidence',
        args: [escrowIdBig(), evidenceHash],
      })
      await publicClient.waitForTransactionReceipt({ hash: txHash })

      toast.success('Evidence submitted ✅', { id: tid })
      await onRefresh()
    } catch (err: any) {
      toast.error(prettyErr(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  async function handleArbiterResolve(released: boolean) {
    if (actionBlockedReason) return toast.error(actionBlockedReason)
    if (!isArbiter) return toast.error('Only arbiter can resolve')
    if (!fundedOnchain || !disputedOnchain) return toast.error('Escrow not in dispute')

    const note = prompt('Resolution note (short). This becomes resolutionHash on-chain.')
    if (!note) return
    const resolutionHash = termsHashFromText(note) as `0x${string}`

    const tid = toast.loading(released ? 'Resolving (release)…' : 'Resolving (refund)…')
    setBusy(true)
    try {
      const fn = released ? 'resolveRelease' : 'resolveRefund'
      const txHash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: fn as any,
        args: [escrowIdBig(), resolutionHash],
      })
      await publicClient.waitForTransactionReceipt({ hash: txHash })

      await safeSync()
      toast.success('Resolved ✅', { id: tid })
      await onRefresh()
    } catch (err: any) {
      toast.error(prettyErr(err), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  // Decide the ONE primary action to show
  const primary: Primary | null = useMemo(() => {
    if (!address) return { label: 'Connect wallet', onClick: () => toast.error('Connect wallet'), tone: 'ghost' }
    if (wrongChain) return { label: 'Switch network', onClick: () => toast.error('Switch to Arc Testnet'), tone: 'ghost' }

    if (releasedOnchain) return null
    if (refundedOnchain) return null

    if (dbStatus === 'AWAITING_DEPOSIT') {
      return {
        label: 'Fund (Deposit)',
        onClick: handleFundEscrow,
        disabled: busy || !tokensReady,
        tone: 'primary',
      }
    }

    if (fundedOnchain && disputedOnchain) {
      if (isArbiter) {
        return { label: 'Resolve (Arbiter)', onClick: () => handleArbiterResolve(true), disabled: busy, tone: 'danger' }
      }
      return null
    }

    if (canExecuteRelease) return { label: 'Execute Release', onClick: handleExecuteRelease, disabled: busy, tone: 'primary' }
    if (canExecuteRefund) return { label: 'Execute Refund', onClick: handleExecuteRefund, disabled: busy, tone: 'primary' }

    if (canApprove) return { label: 'Approve Release', onClick: handleApproveRelease, disabled: busy, tone: 'primary' }

    return null
  }, [
    address,
    wrongChain,
    releasedOnchain,
    refundedOnchain,
    dbStatus,
    fundedOnchain,
    disputedOnchain,
    isArbiter,
    canExecuteRelease,
    canExecuteRefund,
    canApprove,
    busy,
    tokensReady,
  ])

  return (
    <div className="flex flex-col items-end gap-2">
      {primary ? (
       <button
  onClick={primary.onClick}
  disabled={primary.disabled}
  className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-sm disabled:opacity-50 ${btnClass(primary.tone)}`}
  style={primary.tone === 'primary' ? { backgroundColor: '#0E2A55' } : undefined}
>

          {primary.label}
        </button>
      ) : (
        <div className="text-[11px] text-slate-500">
          {releasedOnchain ? 'Released ✅' : refundedOnchain ? 'Refunded ✅' : fundedOnchain && disputedOnchain ? 'Waiting for arbiter' : 'No action'}
        </div>
      )}

      <button
  onClick={() => setShowMore((v) => !v)}
  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
>
        {showMore ? 'Hide actions' : 'More actions'}
      </button>

      {showMore && (
        <div className="flex flex-wrap justify-end gap-2">
          {canApprove && (
            <>
              <button
                onClick={handleApproveRelease}
                disabled={busy}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"

              >
                Approve Release
              </button>
              <button
                onClick={handleApproveRefund}
                disabled={busy}
               className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"

              >
                Approve Refund
              </button>
            </>
          )}

          {fundedOnchain && !disputedOnchain && (
            <>
              <button
                onClick={handleExecuteRelease}
                disabled={busy || !canExecuteRelease}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"

              >
                Execute Release
              </button>
              <button
                onClick={handleExecuteRefund}
                disabled={busy || !canExecuteRefund}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"

              >
                Execute Refund
              </button>
            </>
          )}

          {canTimeoutRefund && (
            <button
              onClick={handleTimeoutRefund}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"

            >
              Timeout Refund
            </button>
          )}

          {canDispute && (
            <button
              onClick={handleDispute}
              disabled={busy || disputeFee == null}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Dispute
            </button>
          )}

          {fundedOnchain && (iAmPayer || iAmPayee) && (
            <button
              onClick={handleSubmitEvidence}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"

            >
              Submit Evidence
            </button>
          )}

          {fundedOnchain && disputedOnchain && isArbiter && (
            <>
              <button
                onClick={() => handleArbiterResolve(true)}
                disabled={busy}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Arbiter: Release
              </button>
              <button
                onClick={() => handleArbiterResolve(false)}
                disabled={busy}
                className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Arbiter: Refund
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
