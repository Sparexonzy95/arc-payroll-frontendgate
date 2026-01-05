// src/features/payrolls/PayrollDetail.tsx
import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  usePayroll,
  usePayrollFunding,
  usePayrollPayments,
  useCreatePayrollOnchain,
} from '../../hooks/hooks/usePayrolls'
import { useChains, useTokens } from '../../hooks/useChains'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/Skeleton'
import { StatusPill } from '../../components/StatusPill'
import { Button } from '../../components/ui/Button'
import { ChainBadge } from '../../components/ChainBadge'

import {
  IconArrowLeft,
  IconWallet,
  IconCoins,
  IconChecklist,
  IconBuildingBank,
  IconExternalLink,
  IconRefresh,
} from '@tabler/icons-react'

import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  usePublicClient,
  useWalletClient,
} from 'wagmi'
import { erc20Abi } from 'viem'
import toast from 'react-hot-toast'
import type { TokenDTO } from '../../api/chains'
import { api } from '../../api/client'

type FundCallPayload = {
  to: string
  data: string
  chainId: number
  token_address: string
  required_atomic: number
  funded_atomic: number
  deficit_atomic: number
  required_human: string
  funded_human: string
  deficit_human: string
}

type RawCall = {
  to: string
  data: string
  chainId: number
}

function atomicToHuman(amountAtomic: string | number | bigint, decimals = 6): string {
  const big =
    typeof amountAtomic === 'bigint'
      ? amountAtomic
      : BigInt(typeof amountAtomic === 'number' ? Math.trunc(amountAtomic) : amountAtomic)

  if (decimals === 0) return big.toString()

  const factor = BigInt(10) ** BigInt(decimals)
  const whole = big / factor
  const fraction = big % factor

  if (fraction === 0n) return whole.toString()

  const fracStr = fraction
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '')

  return `${whole.toString()}.${fracStr}`
}

// Simple mapping from EVM chainId -> explorer base URL
function getExplorerBaseUrl(chainId?: number | null): string | null {
  if (!chainId) return null
  switch (chainId) {
    case 5042002: // Arc Testnet
      return 'https://testnet.arcscan.app'
    case 84532: // Base Sepolia
      return 'https://sepolia-explorer.base.org'
    default:
      return null
  }
}

/**
 * Mobile-safe wait: after switching chains, mobile wallets can lag.
 */
async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/* -----------------------------
   Theme-synced UI helpers
   (keeps naming conventions, only changes visuals)
----------------------------- */
function SurfaceCard(props: { className?: string; children: React.ReactNode }) {
  return (
    <Card
      className={[
        'rounded-[var(--arc-radius-xl)] border border-subtle bg-surface-elevated shadow-soft',
        props.className ?? '',
      ].join(' ')}
    >
      {props.children}
    </Card>
  )
}

function SectionTitle(props: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-ink-primary">{props.title}</h3>
      {props.right}
    </div>
  )
}

function TableShell(props: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[var(--arc-radius-lg)] border border-subtle bg-surface-elevated">
      <div className="overflow-x-auto">{props.children}</div>
    </div>
  )
}

function chipClass(kind: 'warn' | 'ok' | 'info') {
  if (kind === 'ok') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (kind === 'info') return 'bg-blue-50 text-blue-700 border-blue-100'
  return 'bg-amber-50 text-amber-800 border-amber-100'
}

export function PayrollDetail() {
  const params = useParams()
  const id = params.id ? Number(params.id) : undefined

  const { data: payroll, isLoading, error, refetch } = usePayroll(id)
  const { data: funding, refetch: refetchFunding } = usePayrollFunding(id)
  const { data: payments, refetch: refetchPayments } = usePayrollPayments(id)

  const { data: chains } = useChains()
  const { data: tokens } = useTokens()

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync: approveAsync } = useWriteContract()
  const createOnchainMutation = useCreatePayrollOnchain()

  // 🔥 OPTION B: explicit clients (mobile-safe)
  const arcPublicClient = usePublicClient({ chainId: 5042002 })
  const basePublicClient = usePublicClient({ chainId: 84532 })
  const { data: arcWalletClient } = useWalletClient({ chainId: 5042002 })
  const { data: baseWalletClient } = useWalletClient({ chainId: 84532 })

  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [leftoversHuman, setLeftoversHuman] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [creatingOnchain, setCreatingOnchain] = useState(false)

  // single global lock so mobile can’t spam txs
  const [txLock, setTxLock] = useState(false)

  // ✅ Freeze funding from PAYMENTS (source of truth)
  // - payroll.status can lag, but payment.status / dispatched_tx_hash updates first.
  const isDispatched = useMemo(() => {
    const list = (payments ?? []) as any[]
    return list.some(
      (p) =>
        String(p?.status ?? '').toLowerCase() === 'dispatched' || Boolean(p?.dispatched_tx_hash)
    )
  }, [payments])

  function findChain() {
    if (!payroll || !chains) return undefined
    return chains.find((c) => c.id === payroll.source_chain)
  }

  function findTokenByAddress(addr: string | undefined): TokenDTO | undefined {
    if (!tokens || !addr) return undefined
    return tokens.find((t) => t.address.toLowerCase() === addr.toLowerCase())
  }

  function getClients(targetChainId: number) {
    if (targetChainId === 5042002) {
      return { publicClient: arcPublicClient, walletClient: arcWalletClient }
    }
    if (targetChainId === 84532) {
      return { publicClient: basePublicClient, walletClient: baseWalletClient }
    }
    // fallback (shouldn’t happen in your app)
    return { publicClient: arcPublicClient, walletClient: arcWalletClient }
  }

  /**
   * ✅ THE PERMANENT FIX:
   * send raw calldata calls via walletClient with explicit gas + gasPrice.
   * This works on mobile wallets reliably.
   */
  async function sendRawCall(call: RawCall, toastId: string) {
    if (!isConnected || !address) {
      toast.error('Connect your wallet first', { id: toastId })
      throw new Error('Wallet not connected')
    }

    // hard lock: prevents double requests (mobile tap + re-render)
    if (txLock) return
    setTxLock(true)

    try {
      if (chainId !== call.chainId && switchChainAsync) {
        toast.loading('Switching chain.', { id: toastId })
        await switchChainAsync({ chainId: call.chainId })
        // mobile needs a moment to actually settle
        await wait(400)
      }

      const { publicClient, walletClient } = getClients(call.chainId)
      if (!publicClient || !walletClient) {
        throw new Error('Wallet client / public client not ready. Reconnect wallet.')
      }

      // estimate gas ourselves (mobile wallets often fail here)
      const gas = await publicClient.estimateGas({
        account: address,
        to: call.to as `0x${string}`,
        data: call.data as `0x${string}`,
      })

      // force legacy gas pricing (mobile-safe across these testnets)
      const gasPrice = await publicClient.getGasPrice()

      toast.loading('Confirm transaction in wallet.', { id: toastId })

      const hash = await walletClient.sendTransaction({
        account: address,
        to: call.to as `0x${string}`,
        data: call.data as `0x${string}`,
        gas,
        gasPrice,
      })

      return hash
    } finally {
      setTxLock(false)
    }
  }

  // ---------------------------------------------
  // Leftover funds polling
  // ---------------------------------------------
  useEffect(() => {
    if (!payroll || !payroll.id || !payroll.default_token_address) return
    if (!tokens) return

    let cancelled = false
    const REFRESH_MS = 6000

    const fetchLeftovers = async () => {
      try {
        const dbId = payroll.id
        const res = await api.get(`/api/payrolls/payrolls/${dbId}/leftovers/`)
        const raw = res.data.leftover_atomic as string | number
        const tokenMeta = findTokenByAddress(payroll.default_token_address)
        const decimals = tokenMeta?.decimals ?? 6
        const human = atomicToHuman(BigInt(raw), decimals)
        if (!cancelled) setLeftoversHuman(human)
      } catch (e) {
        console.error('Failed to load leftovers', e)
        if (!cancelled) setLeftoversHuman(null)
      }
    }

    fetchLeftovers()
    const interval = window.setInterval(fetchLeftovers, REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payroll?.id, payroll?.default_token_address, tokens])

  // ---------------------------------------------
  // Background polling
  // ---------------------------------------------
  useEffect(() => {
    if (!id) return

    let cancelled = false
    const REFRESH_MS = 2500

    const interval = window.setInterval(() => {
      if (cancelled) return
      // don’t hammer refetch while a tx is being prepared/sent
      if (txLock) return
      refetch()
      refetchFunding()
      refetchPayments()
    }, REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [id, refetch, refetchFunding, refetchPayments, txLock])

  // ---------------------------------------------
  // Actions
  // ---------------------------------------------
  async function syncPayrollNow() {
    if (!payroll || !payroll.id) return
    try {
      await api.post(`/api/payrolls/payrolls/${payroll.id}/sync_now/`)
      await refetch()
    } catch (err) {
      console.error('sync_now failed', err)
    }
  }

  async function handleCreateOnchain() {
    if (!id || !payroll) return
    if (!isConnected || !address) {
      toast.error('Connect your wallet first')
      return
    }

    if (creatingOnchain) return

    try {
      setCreatingOnchain(true)

      toast.loading('Preparing transaction.', { id: 'create-onchain' })
      const call = await createOnchainMutation.mutateAsync(id)

      const hash = await sendRawCall(
        { to: call.to, data: call.data, chainId: call.chainId },
        'create-onchain'
      )

      toast.success(`Transaction submitted: ${hash.slice(0, 10)}...`, {
        id: 'create-onchain',
      })

      setTimeout(() => syncPayrollNow(), 2000)
      setTimeout(() => refetch(), 4000)
    } catch (err: any) {
      console.error(err)
      const msg = err?.shortMessage || err?.message || 'Failed to create payroll on-chain'
      toast.error(msg, { id: 'create-onchain' })
    } finally {
      setCreatingOnchain(false)
    }
  }

  /**
   * FUND PAYROLL (escrow + relayer gas)
   */
  async function handleFundPayroll() {
    // ✅ HARD GUARD: once dispatched (from payments), funding is locked
    if (isDispatched) {
      toast.error('Payroll is already dispatched. Funding is locked.')
      return
    }

    if (!payroll) {
      toast.error('No payroll loaded')
      return
    }

    if (!isConnected || !address) {
      toast.error('Connect your wallet to fund')
      return
    }

    const dbId = payroll.id ?? id
    if (!dbId) {
      toast.error('Missing payroll id')
      return
    }

    try {
      const tokenAddress = (payroll.default_token_address ||
        funding?.summary?.[0]?.token_address) as `0x${string}`

      if (!tokenAddress) {
        toast.error('No token address available for funding')
        return
      }

      const tokenMeta = findTokenByAddress(tokenAddress)
      const decimals = tokenMeta?.decimals ?? 6

      const totalPayments =
        typeof payroll.total_payments === 'number'
          ? payroll.total_payments
          : Number(payroll.total_payments ?? 0)

      const rewardPerDispatchHuman = '0.01'
      const rewardPerDispatchNum = 0.01
      const rewardPoolTotalNum = totalPayments > 0 ? rewardPerDispatchNum * totalPayments : 0

      const rewardPoolTotalHuman =
        rewardPoolTotalNum > 0
          ? rewardPoolTotalNum.toFixed(decimals)
          : '0'.padEnd(decimals + 2, '0')

      const rewardPoolAtomic =
        rewardPoolTotalNum > 0 ? BigInt(Math.round(rewardPoolTotalNum * 10 ** decimals)) : 0n

      toast.loading('Preparing funding transactions.', { id: 'fund' })

      // 1) backend builds deficit call
      const fundRes = await api.post(`/api/payrolls/payrolls/${dbId}/fund/`, {
        token_address: tokenAddress,
      })
      const fundCall: FundCallPayload = fundRes.data

      const escrowDeficitAtomic = BigInt(fundCall.deficit_atomic)
      if (escrowDeficitAtomic <= 0n) {
        toast.success('Payroll is already fully funded!')
        return
      }

      let setRewardCall: { to: string; data: string; chainId: number } | null = null
      let fundRewardCall: { to: string; data: string; chainId: number } | null = null

      if (rewardPoolTotalNum > 0 && totalPayments > 0) {
        try {
          const resSet = await api.post(`/api/payrolls/payrolls/${dbId}/set_relayer_reward/`, {
            token_address: tokenAddress,
            reward_human: rewardPerDispatchHuman,
          })
          setRewardCall = resSet.data

          const resReward = await api.post(`/api/payrolls/payrolls/${dbId}/fund_relayer_reward/`, {
            token_address: tokenAddress,
            amount_human: rewardPoolTotalHuman,
          })
          fundRewardCall = resReward.data
        } catch (err: any) {
          console.error('Relayer reward setup failed, continuing with escrow only', err)
          toast.error(
            'Relayer reward setup failed, funding escrow only. Check backend set_relayer_reward/fund_relayer_reward.'
          )
        }
      }

      const extraRewardAtomic = setRewardCall && fundRewardCall ? rewardPoolAtomic : 0n
      const totalApproveAmount = escrowDeficitAtomic + extraRewardAtomic

      // 3) approve (ABI write is already safe)
      toast.loading('Approving token spend.', { id: 'fund' })
      await approveAsync({
        chainId: fundCall.chainId,
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [fundCall.to as `0x${string}`, totalApproveAmount],
      })

      // 4) configure reward (optional)
      if (setRewardCall) {
        toast.loading('Configuring relayer reward.', { id: 'fund' })
        await sendRawCall(setRewardCall, 'fund')
      }

      // 5) fund escrow
      toast.loading(`Funding payroll with ${fundCall.deficit_human} units.`, { id: 'fund' })
      const hash = await sendRawCall(
        { to: fundCall.to, data: fundCall.data, chainId: fundCall.chainId },
        'fund'
      )

      // 6) fund reward pool (optional)
      if (fundRewardCall) {
        toast.loading('Funding relayer gas vault.', { id: 'fund' })
        await sendRawCall(fundRewardCall, 'fund')
      }

      // force backend event sync
      try {
        await api.post(`/api/payrolls/payrolls/${dbId}/sync_funding/`)
      } catch (e) {
        console.error('sync_funding failed (non-fatal)', e)
      }

      refetchFunding()
      refetch()

      toast.success(`Payroll funded! Tx: ${hash.slice(0, 10)}...`, { id: 'fund' })
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.response?.data?.detail ||
        err?.shortMessage ||
        err?.message ||
        'Failed to fund payroll'
      toast.error(msg, { id: 'fund' })
    }
  }

  async function handleVerifyOnchain(paymentId: number) {
    try {
      setVerifyingId(paymentId)

      const res = await api.get(`/api/payrolls/payments/${paymentId}/verify_onchain/`)
      const data = res.data as {
        status_db: string
        onchain_is_processed: boolean | null
        receipt_status: number | null
        tx_hash?: string | null
        chain_name?: string
        chain_id?: number
      }

      if (data.onchain_is_processed && data.receipt_status === 1) {
        toast.success(`Verified on chain: processed on ${data.chain_name ?? 'chain'}`)
      } else if (data.onchain_is_processed === false) {
        toast.error('On chain reports this payment as not processed yet')
      } else {
        toast.error('Could not fully verify this payment on chain')
      }

      await refetchPayments()
      await refetchFunding()
      await refetch()
    } catch (err: any) {
      console.error(err)
      const msg = err?.response?.data?.detail || err?.message || 'Failed to verify on chain'
      toast.error(msg)
    } finally {
      setVerifyingId(null)
    }
  }

  async function handleFinalizePayroll() {
    if (!payroll) {
      toast.error('No payroll loaded')
      return
    }
    if (!isConnected || !address) {
      toast.error('Connect your wallet to finalize')
      return
    }

    const dbId = payroll.id ?? id
    if (!dbId) {
      toast.error('Missing payroll id')
      return
    }

    try {
      setFinalizing(true)
      toast.loading('Preparing finalize transaction.', { id: 'finalize' })

      const res = await api.post(`/api/payrolls/payrolls/${dbId}/finalize/`)
      const call: RawCall = res.data

      const hash = await sendRawCall(call, 'finalize')

      toast.success(`Finalize submitted: ${hash.slice(0, 10)}...`, { id: 'finalize' })

      await refetch()
      await refetchPayments()
      await refetchFunding()
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.response?.data?.detail ||
        err?.shortMessage ||
        err?.message ||
        'Failed to finalize payroll'
      toast.error(msg, { id: 'finalize' })
    } finally {
      setFinalizing(false)
    }
  }

  async function handleWithdrawLeftovers() {
    if (!payroll) {
      toast.error('No payroll loaded')
      return
    }
    if (!isConnected || !address) {
      toast.error('Connect your wallet to withdraw')
      return
    }
    if (!leftoversHuman || parseFloat(leftoversHuman) <= 0) {
      toast.error('No leftovers to withdraw')
      return
    }

    const dbId = payroll.id ?? id
    if (!dbId) {
      toast.error('Missing payroll id')
      return
    }

    try {
      setWithdrawing(true)
      toast.loading('Preparing withdraw transaction.', { id: 'withdraw' })

      const res = await api.post(`/api/payrolls/payrolls/${dbId}/withdraw/`, {
        token_address: payroll.default_token_address,
        to_address: address,
      })

      const call: RawCall = res.data
      const hash = await sendRawCall(call, 'withdraw')

      toast.success(`Withdraw submitted: ${hash.slice(0, 10)}...`, { id: 'withdraw' })

      await refetchFunding()
      await refetch()
      await refetchPayments()
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.response?.data?.detail ||
        err?.shortMessage ||
        err?.message ||
        'Failed to withdraw leftovers'
      toast.error(msg, { id: 'withdraw' })
    } finally {
      setWithdrawing(false)
    }
  }

  const chain = useMemo(() => findChain(), [payroll, chains])
  const token = useMemo(
    () => findTokenByAddress(payroll?.default_token_address),
    [tokens, payroll?.default_token_address]
  )
  const explorerBase = getExplorerBaseUrl(chain?.chain_id)

  const fundingSummary = funding?.summary ?? []
  const deficit = fundingSummary?.[0]?.deficit ?? '0.00'
  const hasDeficit = Number(deficit) > 0

  // ✅ Final UI disable flag
  const fundDisabled = txLock || isDispatched

  // ---------------------------------------------
  // Loading / error states (theme-synced)
  // ---------------------------------------------
  if (isLoading) {
    return (
      <SurfaceCard className="p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </SurfaceCard>
    )
  }

  if (error || !payroll) {
    return (
      <SurfaceCard className="p-6">
        <p className="text-sm text-red-600">Failed to load payroll.</p>
      </SurfaceCard>
    )
  }

  return (
    <div className="bg-surface-body">
      <div className="space-y-5">
        {/* Back */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink-primary"
          >
            <IconArrowLeft size={16} />
            Dashboard
          </Link>
        </div>

        {/* Header */}
        <SurfaceCard className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-semibold text-ink-primary">
                {payroll.title || `Payroll #${payroll.payroll_id}`}
              </h2>
              <p className="text-sm text-ink-soft">
                On-chain ID <span className="font-semibold text-ink-primary">#{payroll.payroll_id}</span>{' '}
                {chain ? (
                  <>
                    · <span className="text-ink-soft">{chain.name}</span>
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <StatusPill status={payroll.status} />
              {chain && <ChainBadge name={chain.name} chainId={chain.chain_id} />}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-[var(--arc-radius-lg)] border border-subtle bg-surface-elevated p-4">
              <p className="text-xs font-semibold text-ink-muted">Chain</p>
              <p className="mt-1 text-sm text-ink-primary">
                {chain ? `${chain.name} (chainId ${chain.chain_id})` : 'Unknown'}
              </p>
            </div>

            <div className="rounded-[var(--arc-radius-lg)] border border-subtle bg-surface-elevated p-4">
              <p className="text-xs font-semibold text-ink-muted">Default token</p>
              <p className="mt-1 text-sm text-ink-primary">
                {token ? token.symbol : 'Token'}{' '}
                <span className="text-ink-soft">
                  · {payroll.default_token_address?.slice(0, 6)}…{payroll.default_token_address?.slice(-4)}
                </span>
              </p>
            </div>

            <div className="rounded-[var(--arc-radius-lg)] border border-subtle bg-surface-elevated p-4">
              <p className="text-xs font-semibold text-ink-muted">Totals</p>
              <p className="mt-1 text-sm text-ink-primary">
                Net: <span className="font-mono">{payroll.total_net_amount}</span> · Tax:{' '}
                <span className="font-mono">{payroll.total_tax_amount}</span>
              </p>
              <p className="mt-1 text-xs text-ink-soft">{payroll.total_payments} scheduled payments</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {payroll.status === 'draft' && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleCreateOnchain}
                disabled={creatingOnchain || txLock}
                loading={creatingOnchain || createOnchainMutation.isPending || txLock}
              >
                <IconChecklist size={16} />
                Create on-chain
              </Button>
            )}

            {/* ✅ FUNDING FREEZE WHEN ANY PAYMENT IS DISPATCHED */}
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFundPayroll}
              disabled={fundDisabled}
              title={isDispatched ? 'Payments dispatched. Funding locked.' : txLock ? 'Transaction in progress' : undefined}
            >
              <IconWallet size={16} />
              {isDispatched ? 'Funding locked' : 'Fund payroll'}
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleFinalizePayroll}
              disabled={finalizing || txLock}
              loading={finalizing || txLock}
            >
              <IconBuildingBank size={16} />
              Finalize
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleWithdrawLeftovers}
              disabled={withdrawing || txLock}
              loading={withdrawing || txLock}
            >
              <IconCoins size={16} />
              Withdraw leftovers
            </Button>

            {leftoversHuman && parseFloat(leftoversHuman) > 0 ? (
              <span
                className={[
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
                  chipClass('info'),
                ].join(' ')}
              >
                Leftovers: <span className="font-mono">{leftoversHuman}</span>
              </span>
            ) : null}
          </div>

          {txLock ? (
            <p className="mt-3 text-[11px] text-ink-muted">
              Transaction in progress. Please confirm in your wallet.
            </p>
          ) : null}

          {isDispatched ? (
            <p className="mt-3 text-[11px] text-ink-muted">
              Dispatch started (from payments). Funding is locked to keep balances consistent.
            </p>
          ) : null}
        </SurfaceCard>

        {/* Funding */}
        <SurfaceCard className="p-5 space-y-3">
          <SectionTitle
            title="Funding"
            right={
              hasDeficit ? (
                <span
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
                    chipClass('warn'),
                  ].join(' ')}
                >
                  ⚠ Deficit: <span className="font-mono">{deficit}</span>
                </span>
              ) : (
                <span
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
                    chipClass('ok'),
                  ].join(' ')}
                >
                  ✓ Funded
                </span>
              )
            }
          />

          {funding ? (
            fundingSummary.length === 0 ? (
              <p className="text-sm text-ink-muted">No funding summary yet.</p>
            ) : (
              <TableShell>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface-sunken text-xs font-semibold text-ink-muted">
                    <tr>
                      <th className="px-4 py-3">Token</th>
                      <th className="px-4 py-3 text-right">Required (atomic)</th>
                      <th className="px-4 py-3 text-right">Funded (atomic)</th>
                      <th className="px-4 py-3 text-right">Deficit (atomic)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--arc-divider)]">
                    {fundingSummary.map((item) => {
                      const t = findTokenByAddress(item.token_address)
                      const rowDeficit = Number(item.deficit ?? 0)
                      return (
                        <tr key={item.token_address} className="hover:bg-surface-sunken/60">
                          <td className="px-4 py-3 font-medium text-ink-primary">
                            {t ? t.symbol : item.token_address}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-ink-primary">
                            {item.required}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-ink-primary">
                            {item.funded}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className={rowDeficit > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                              {item.deficit}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </TableShell>
            )
          ) : (
            <p className="text-sm text-ink-muted">Loading funding…</p>
          )}
        </SurfaceCard>

        {/* Payments */}
        <SurfaceCard className="p-5 space-y-3">
          <SectionTitle
            title="Payments"
            right={<p className="text-xs text-ink-muted">Total {payments?.length ?? 0} rows</p>}
          />

          {payments && payments.length > 0 ? (
            <TableShell>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-sunken text-xs font-semibold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Index</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3 text-right">Net</th>
                    <th className="px-4 py-3 text-right">Tax</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Tx</th>
                    <th className="px-4 py-3 text-right">Verify</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--arc-divider)]">
                  {payments.map((p) => {
                    const t = findTokenByAddress(p.token_address)
                    const shortTx =
                      p.dispatched_tx_hash &&
                      `${p.dispatched_tx_hash.slice(0, 10)}…${p.dispatched_tx_hash.slice(-4)}`

                    const fullTx =
                      p.dispatched_tx_hash &&
                      (p.dispatched_tx_hash.startsWith('0x')
                        ? p.dispatched_tx_hash
                        : `0x${p.dispatched_tx_hash}`)

                    const txLink = explorerBase && fullTx ? `${explorerBase}/tx/${fullTx}` : null

                    return (
                      <tr key={p.id} className="hover:bg-surface-sunken/60">
                        <td className="px-4 py-3 font-mono text-ink-primary">{p.payroll_index}</td>
                        <td className="px-4 py-3 font-mono text-ink-primary">
                          {p.employee_address.slice(0, 6)}…{p.employee_address.slice(-4)}
                        </td>
                        <td className="px-4 py-3 text-ink-primary">
                          {t ? t.symbol : `${p.token_address.slice(0, 6)}…`}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink-primary">
                          {p.net_amount_atomic}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink-primary">
                          {p.tax_amount_atomic}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={p.status} />
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {txLink && shortTx ? (
                            <a
                              href={txLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-ink-primary underline decoration-dotted hover:opacity-80"
                            >
                              {shortTx}
                              <IconExternalLink size={14} />
                            </a>
                          ) : (
                            <span className="text-ink-muted">{shortTx ?? '—'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => handleVerifyOnchain(p.id)}
                            disabled={verifyingId === p.id}
                          >
                            <IconRefresh size={14} />
                            {verifyingId === p.id ? 'Verifying...' : 'Verify'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableShell>
          ) : (
            <p className="text-sm text-ink-muted">No payments found.</p>
          )}
        </SurfaceCard>
      </div>
    </div>
  )
}
