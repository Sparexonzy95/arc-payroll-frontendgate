// src/features/payrolls/PayrollDetail.tsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  usePayroll,
  usePayrollFunding,
  usePayrollPayments,
} from '../../hooks/hooks/usePayrolls'
import { useChains, useTokens } from '../../hooks/useChains'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/Skeleton'
import { StatusPill } from '../../components/StatusPill'
import { Button } from '../../components/ui/Button'
import { ChainBadge } from '../../components/ChainBadge'
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useSendTransaction,
  useWriteContract,
} from 'wagmi'
import { erc20Abi } from 'viem'
import toast from 'react-hot-toast'
import type { TokenDTO } from '../../api/chains'
import { api } from '../../api/client'

type CallPayload = { to: string; data: string; chainId: number }

type FundCallPayload = CallPayload & {
  token_address: string
  required_atomic: number
  funded_atomic: number
  deficit_atomic: number
  required_human: string
  funded_human: string
  deficit_human: string
}

function atomicToHuman(
  amountAtomic: string | number | bigint,
  decimals = 6
): string {
  const big =
    typeof amountAtomic === 'bigint'
      ? amountAtomic
      : BigInt(
          typeof amountAtomic === 'number'
            ? Math.trunc(amountAtomic)
            : amountAtomic
        )

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

function getExplorerBaseUrl(chainId?: number | null): string | null {
  if (!chainId) return null
  switch (chainId) {
    case 5042002:
      return 'https://testnet.arcscan.app'
    case 84532:
      return 'https://sepolia-explorer.base.org'
    default:
      return null
  }
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
  const { sendTransactionAsync, status: txStatus } = useSendTransaction()
  const { writeContractAsync: approveAsync } = useWriteContract()

  const [verifyingId, setVerifyingId] = useState<number | null>(null)

  const [leftoversHuman, setLeftoversHuman] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [creatingOnchain, setCreatingOnchain] = useState(false)
  const [fundingNow, setFundingNow] = useState(false)

  // -----------------------------
  // Prepared backend calls (KEY FIX)
  // -----------------------------
  const [preparedCreateOnchain, setPreparedCreateOnchain] = useState<CallPayload | null>(null)
  const [preparedFund, setPreparedFund] = useState<FundCallPayload | null>(null)
  const [preparedSetReward, setPreparedSetReward] = useState<CallPayload | null>(null)
  const [preparedFundReward, setPreparedFundReward] = useState<CallPayload | null>(null)
  const [preparedFinalize, setPreparedFinalize] = useState<CallPayload | null>(null)
  const [preparedWithdraw, setPreparedWithdraw] = useState<CallPayload | null>(null)

  const [preparing, setPreparing] = useState({
    create: false,
    fund: false,
    finalize: false,
    withdraw: false,
  })

  function findChain() {
    if (!payroll || !chains) return undefined
    return chains.find((c) => c.id === payroll.source_chain)
  }

  function findTokenByAddress(addr: string | undefined): TokenDTO | undefined {
    if (!tokens || !addr) return undefined
    return tokens.find((t) => t.address.toLowerCase() === addr.toLowerCase())
  }

  const chain = useMemo(() => findChain(), [payroll, chains])
  const token = useMemo(
    () => findTokenByAddress(payroll?.default_token_address),
    [payroll?.default_token_address, tokens]
  )
  const explorerBase = getExplorerBaseUrl(chain?.chain_id)

  const dbId = payroll?.id ?? id

  // -----------------------------
  // Leftovers polling
  // -----------------------------
  useEffect(() => {
    if (!payroll || !payroll.id || !payroll.default_token_address) return
    if (!tokens) return

    let cancelled = false
    const REFRESH_MS = 6000

    const fetchLeftovers = async () => {
      try {
        const res = await api.get(`/api/payrolls/payrolls/${payroll.id}/leftovers/`)
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

  // -----------------------------
  // Background polling for payroll + funding + payments
  // -----------------------------
  useEffect(() => {
    if (!id) return
    let cancelled = false
    const REFRESH_MS = 2500
    const interval = window.setInterval(() => {
      if (cancelled) return
      refetch()
      refetchFunding()
      refetchPayments()
    }, REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [id, refetch, refetchFunding, refetchPayments])

  // -----------------------------
  // Helpers
  // -----------------------------
  const ensureConnected = () => {
    if (!isConnected || !address) {
      toast.error('Connect your wallet first')
      return false
    }
    return true
  }

  const ensureChain = async (targetChainId: number, toastId: string) => {
    if (chainId !== targetChainId && switchChainAsync) {
      toast.loading('Switching chain...', { id: toastId })
      await switchChainAsync({ chainId: targetChainId })
    }
  }

  const syncPayrollNow = useCallback(async () => {
    if (!payroll?.id) return
    try {
      await api.post(`/api/payrolls/payrolls/${payroll.id}/sync_now/`)
      await refetch()
    } catch (err) {
      console.error('sync_now failed', err)
    }
  }, [payroll?.id, refetch])

  // -----------------------------
  // PREPARE: Create on-chain call
  // -----------------------------
  const prepareCreateOnchain = useCallback(async () => {
    if (!dbId) return
    if (!payroll) return
    if (payroll.status !== 'draft') {
      setPreparedCreateOnchain(null)
      return
    }
    if (preparing.create) return

    try {
      setPreparing((s) => ({ ...s, create: true }))
      const res = await api.post(`/api/payrolls/payrolls/${dbId}/create_onchain/`)
      const call = res.data as CallPayload
      setPreparedCreateOnchain(call)
    } catch (e) {
      console.error('prepareCreateOnchain failed', e)
      setPreparedCreateOnchain(null)
    } finally {
      setPreparing((s) => ({ ...s, create: false }))
    }
  }, [dbId, payroll, preparing.create])

  // -----------------------------
  // PREPARE: Fund payroll call (+ reward calls)
  // -----------------------------
  const prepareFund = useCallback(async () => {
    if (!dbId) return
    if (!payroll) return
    if (!tokens) return
    if (preparing.fund) return

    // choose token for now: default token
    const tokenAddress = (payroll.default_token_address ||
      funding?.summary?.[0]?.token_address) as `0x${string}` | undefined

    if (!tokenAddress) {
      setPreparedFund(null)
      setPreparedSetReward(null)
      setPreparedFundReward(null)
      return
    }

    // reward config
    const totalPayments =
      typeof payroll.total_payments === 'number'
        ? payroll.total_payments
        : Number(payroll.total_payments ?? 0)

    const tokenMeta = findTokenByAddress(tokenAddress)
    const decimals = tokenMeta?.decimals ?? 6

    const rewardPerDispatchHuman = '0.01'
    const rewardPerDispatchNum = 0.01
    const rewardPoolTotalNum =
      totalPayments > 0 ? rewardPerDispatchNum * totalPayments : 0

    const rewardPoolTotalHuman =
      rewardPoolTotalNum > 0
        ? rewardPoolTotalNum.toFixed(decimals)
        : '0'.padEnd(decimals + 2, '0')

    try {
      setPreparing((s) => ({ ...s, fund: true }))

      // 1) fund call
      const fundRes = await api.post(`/api/payrolls/payrolls/${dbId}/fund/`, {
        token_address: tokenAddress,
      })
      const fundCall = fundRes.data as FundCallPayload
      setPreparedFund(fundCall)

      // 2) reward calls (optional)
      if (rewardPoolTotalNum > 0 && totalPayments > 0) {
        try {
          const resSet = await api.post(
            `/api/payrolls/payrolls/${dbId}/set_relayer_reward/`,
            {
              token_address: tokenAddress,
              reward_human: rewardPerDispatchHuman,
            }
          )
          setPreparedSetReward(resSet.data as CallPayload)

          const resReward = await api.post(
            `/api/payrolls/payrolls/${dbId}/fund_relayer_reward/`,
            {
              token_address: tokenAddress,
              amount_human: rewardPoolTotalHuman,
            }
          )
          setPreparedFundReward(resReward.data as CallPayload)
        } catch (err) {
          console.error('prepare reward calls failed (non-fatal)', err)
          setPreparedSetReward(null)
          setPreparedFundReward(null)
        }
      } else {
        setPreparedSetReward(null)
        setPreparedFundReward(null)
      }
    } catch (e) {
      console.error('prepareFund failed', e)
      setPreparedFund(null)
      setPreparedSetReward(null)
      setPreparedFundReward(null)
    } finally {
      setPreparing((s) => ({ ...s, fund: false }))
    }
  }, [dbId, payroll, tokens, funding?.summary, preparing.fund])

  // -----------------------------
  // PREPARE: Finalize call
  // -----------------------------
  const prepareFinalize = useCallback(async () => {
    if (!dbId) return
    if (!payroll) return
    if (payroll.status === 'finalized') {
      setPreparedFinalize(null)
      return
    }
    if (preparing.finalize) return

    try {
      setPreparing((s) => ({ ...s, finalize: true }))
      const res = await api.post(`/api/payrolls/payrolls/${dbId}/finalize/`)
      setPreparedFinalize(res.data as CallPayload)
    } catch (e) {
      console.error('prepareFinalize failed', e)
      setPreparedFinalize(null)
    } finally {
      setPreparing((s) => ({ ...s, finalize: false }))
    }
  }, [dbId, payroll, preparing.finalize])

  // -----------------------------
  // PREPARE: Withdraw leftovers call (needs address)
  // -----------------------------
  const prepareWithdraw = useCallback(async () => {
    if (!dbId) return
    if (!payroll?.default_token_address) return
    if (!address) {
      setPreparedWithdraw(null)
      return
    }
    if (!leftoversHuman || parseFloat(leftoversHuman) <= 0) {
      setPreparedWithdraw(null)
      return
    }
    if (preparing.withdraw) return

    try {
      setPreparing((s) => ({ ...s, withdraw: true }))
      const res = await api.post(`/api/payrolls/payrolls/${dbId}/withdraw/`, {
        token_address: payroll.default_token_address,
        to_address: address,
      })
      setPreparedWithdraw(res.data as CallPayload)
    } catch (e) {
      console.error('prepareWithdraw failed', e)
      setPreparedWithdraw(null)
    } finally {
      setPreparing((s) => ({ ...s, withdraw: false }))
    }
  }, [dbId, payroll?.default_token_address, address, leftoversHuman, preparing.withdraw])

  // -----------------------------
  // Auto-prepare on background changes
  // -----------------------------
  useEffect(() => {
    if (!payroll || !dbId) return

    // Create on-chain
    if (payroll.status === 'draft') {
      prepareCreateOnchain()
    } else {
      setPreparedCreateOnchain(null)
    }

    // Fund call (keep fresh)
    if (funding && funding.summary && funding.summary.length > 0) {
      prepareFund()
    } else {
      setPreparedFund(null)
      setPreparedSetReward(null)
      setPreparedFundReward(null)
    }

    // Finalize call (if not finalized)
    if (payroll.status !== 'finalized') {
      prepareFinalize()
    } else {
      setPreparedFinalize(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    payroll?.status,
    payroll?.default_token_address,
    payroll?.total_payments,
    dbId,
    funding?.summary?.length,
  ])

  useEffect(() => {
    // Withdraw depends on leftovers + address
    prepareWithdraw()
  }, [prepareWithdraw])

  // -----------------------------
  // ACTIONS (wallet-first)
  // -----------------------------
  async function handleCreateOnchain() {
    if (!ensureConnected()) return
    if (!dbId || !payroll) return
    if (creatingOnchain) return

    try {
      setCreatingOnchain(true)

      // If not prepared yet, prepare and ask user to tap again (still better than failing silently)
      if (!preparedCreateOnchain) {
        toast.loading('Preparing transaction...', { id: 'create-onchain' })
        await prepareCreateOnchain()
        toast.dismiss('create-onchain')
        if (!preparedCreateOnchain) {
          toast.error('Could not prepare create on-chain call. Try again.')
          return
        }
      }

      const call = preparedCreateOnchain as CallPayload

      toast.loading('Confirm transaction in wallet...', { id: 'create-onchain' })
      await ensureChain(call.chainId, 'create-onchain')

      const hash = await sendTransactionAsync({
        to: call.to as `0x${string}`,
        data: call.data as `0x${string}`,
      })

      toast.success(`Transaction submitted: ${hash.slice(0, 10)}...`, {
        id: 'create-onchain',
      })

      setTimeout(() => {
        syncPayrollNow()
      }, 2000)

      setTimeout(() => {
        refetch()
      }, 4000)
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.shortMessage || err?.message || 'Failed to create payroll on-chain'
      toast.error(msg, { id: 'create-onchain' })
    } finally {
      setCreatingOnchain(false)
    }
  }

  async function handleFundPayroll() {
    if (!ensureConnected()) return
    if (!payroll) return
    if (!dbId) return
    if (fundingNow) return

    try {
      setFundingNow(true)

      if (!preparedFund) {
        toast.loading('Preparing funding...', { id: 'fund' })
        await prepareFund()
        toast.dismiss('fund')
        if (!preparedFund) {
          toast.error('Could not prepare funding call. Try again.')
          return
        }
      }

      const fundCall = preparedFund as FundCallPayload

      const escrowDeficitAtomic = BigInt(fundCall.deficit_atomic)
      if (escrowDeficitAtomic <= 0n) {
        toast.success('Payroll is already fully funded!')
        return
      }

      // total payments for reward pool (same logic as prepareFund)
      const totalPayments =
        typeof payroll.total_payments === 'number'
          ? payroll.total_payments
          : Number(payroll.total_payments ?? 0)

      const tokenAddress = (payroll.default_token_address ||
        funding?.summary?.[0]?.token_address) as `0x${string}`

      const tokenMeta = findTokenByAddress(tokenAddress)
      const decimals = tokenMeta?.decimals ?? 6

      const rewardPerDispatchNum = 0.01
      const rewardPoolTotalNum =
        totalPayments > 0 ? rewardPerDispatchNum * totalPayments : 0

      const rewardPoolAtomic =
        rewardPoolTotalNum > 0
          ? BigInt(Math.round(rewardPoolTotalNum * 10 ** decimals))
          : 0n

      const extraRewardAtomic =
        preparedSetReward && preparedFundReward ? rewardPoolAtomic : 0n

      const totalApproveAmount = escrowDeficitAtomic + extraRewardAtomic

      toast.loading('Confirm approvals in wallet...', { id: 'fund' })
      await ensureChain(fundCall.chainId, 'fund')

      // Approve
      await approveAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [fundCall.to as `0x${string}`, totalApproveAmount],
      })

      // Configure reward (optional)
      if (preparedSetReward) {
        toast.loading('Configuring relayer reward...', { id: 'fund' })
        await sendTransactionAsync({
          to: preparedSetReward.to as `0x${string}`,
          data: preparedSetReward.data as `0x${string}`,
        })
      }

      // Fund escrow
      toast.loading(`Funding payroll...`, { id: 'fund' })
      const hash = await sendTransactionAsync({
        to: fundCall.to as `0x${string}`,
        data: fundCall.data as `0x${string}`,
      })

      // Fund reward pool (optional)
      if (preparedFundReward) {
        toast.loading('Funding relayer gas vault...', { id: 'fund' })
        await sendTransactionAsync({
          to: preparedFundReward.to as `0x${string}`,
          data: preparedFundReward.data as `0x${string}`,
        })
      }

      // Force funding sync
      try {
        await api.post(`/api/payrolls/payrolls/${dbId}/sync_funding/`)
      } catch (e) {
        console.error('sync_funding failed (non-fatal)', e)
      }

      refetchFunding()
      refetch()

      toast.success(`Payroll funded! Tx: ${hash.slice(0, 10)}...`, {
        id: 'fund',
      })

      // Refresh prepared calls after funding changes
      prepareFund()
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.response?.data?.detail ||
        err?.shortMessage ||
        err?.message ||
        'Failed to fund payroll'
      toast.error(msg, { id: 'fund' })
    } finally {
      setFundingNow(false)
    }
  }

  async function handleFinalizePayroll() {
    if (!ensureConnected()) return
    if (!payroll || !dbId) return
    if (finalizing) return

    try {
      setFinalizing(true)

      if (!preparedFinalize) {
        toast.loading('Preparing finalize...', { id: 'finalize' })
        await prepareFinalize()
        toast.dismiss('finalize')
        if (!preparedFinalize) {
          toast.error('Could not prepare finalize call. Try again.')
          return
        }
      }

      const call = preparedFinalize as CallPayload

      toast.loading('Confirm finalize in wallet...', { id: 'finalize' })
      await ensureChain(call.chainId, 'finalize')

      const hash = await sendTransactionAsync({
        to: call.to as `0x${string}`,
        data: call.data as `0x${string}`,
      })

      toast.success(`Finalize submitted: ${hash.slice(0, 10)}...`, {
        id: 'finalize',
      })

      await refetch()
      await refetchPayments()
      await refetchFunding()

      prepareFinalize()
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
    if (!ensureConnected()) return
    if (!payroll || !dbId) return
    if (withdrawing) return

    if (!leftoversHuman || parseFloat(leftoversHuman) <= 0) {
      toast.error('No leftovers to withdraw')
      return
    }

    try {
      setWithdrawing(true)

      if (!preparedWithdraw) {
        toast.loading('Preparing withdraw...', { id: 'withdraw' })
        await prepareWithdraw()
        toast.dismiss('withdraw')
        if (!preparedWithdraw) {
          toast.error('Could not prepare withdraw call. Try again.')
          return
        }
      }

      const call = preparedWithdraw as CallPayload

      toast.loading('Confirm withdraw in wallet...', { id: 'withdraw' })
      await ensureChain(call.chainId, 'withdraw')

      const hash = await sendTransactionAsync({
        to: call.to as `0x${string}`,
        data: call.data as `0x${string}`,
      })

      toast.success(`Withdraw submitted: ${hash.slice(0, 10)}...`, {
        id: 'withdraw',
      })

      await refetchFunding()
      await refetch()
      await refetchPayments()

      prepareWithdraw()
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
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to verify on chain'
      toast.error(msg)
    } finally {
      setVerifyingId(null)
    }
  }

  // -----------------------------
  // Loading / error states
  // -----------------------------
  if (isLoading) {
    return (
      <Card className="space-y-4 border border-slate-800/80 bg-slate-950/70 p-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </Card>
    )
  }

  if (error || !payroll) {
    return (
      <Card className="border border-rose-500/40 bg-slate-950/80 p-6">
        <p className="text-sm text-rose-300">Failed to load payroll.</p>
      </Card>
    )
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="space-y-5">
      {/* Header / meta */}
      <Card className="space-y-4 border border-slate-800/80 bg-slate-950/80 p-5 shadow-lg shadow-sky-500/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-50">
              {payroll.title || `Payroll #${payroll.payroll_id}`}
            </h2>
            <p className="text-sm text-slate-300">
              On-chain ID #{payroll.payroll_id}{' '}
              {chain && (
                <>
                  · <span>{chain.name} (#{chain.chain_id})</span>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusPill status={payroll.status} />
            {chain && <ChainBadge name={chain.name} chainId={chain.chain_id} />}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1 text-sm text-slate-200">
            <p className="font-semibold text-slate-400">Chain</p>
            {chain ? (
              <p className="flex items-center gap-2">
                <ChainBadge name={chain.name} chainId={chain.chain_id} />
              </p>
            ) : (
              <p className="text-slate-500">Unknown chain</p>
            )}
          </div>
          <div className="space-y-1 text-sm text-slate-200">
            <p className="font-semibold text-slate-400">Default token</p>
            {token ? (
              <p className="font-mono text-xs">
                {token.symbol} · {token.address.slice(0, 6)}…{token.address.slice(-4)}
              </p>
            ) : (
              <p className="text-slate-500">Unknown token</p>
            )}
          </div>
          <div className="space-y-1 text-sm text-slate-200">
            <p className="font-semibold text-slate-400">Totals</p>
            <p className="font-mono text-xs">
              Net: {payroll.total_net_amount} · Tax: {payroll.total_tax_amount}
            </p>
            <p className="text-slate-500 text-xs">{payroll.total_payments} scheduled payments</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {payroll.status === 'draft' && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreateOnchain}
              loading={
                creatingOnchain ||
                preparing.create ||
                txStatus === 'pending'
              }
            >
              {preparedCreateOnchain ? 'Create on-chain' : preparing.create ? 'Preparing…' : 'Create on-chain'}
            </Button>
          )}

          {funding && funding.summary.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFundPayroll}
              loading={fundingNow || preparing.fund}
            >
              {preparedFund ? 'Fund payroll' : preparing.fund ? 'Preparing…' : 'Fund payroll'}
            </Button>
          )}
        </div>

        {/* Small “prepared” hint (optional) */}
        <div className="text-[11px] text-slate-500">
          Mobile note: actions are pre-prepared in the background so wallet opens instantly.
        </div>
      </Card>

      {/* Funding */}
      <Card className="space-y-3 border border-slate-800/80 bg-slate-950/80 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Funding</h3>
        </div>
        {funding ? (
          <>
            {funding.summary.length === 0 ? (
              <p className="text-sm text-slate-400">
                No funding summary yet. This will populate once events are indexed.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/90">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-slate-200">
                    <thead className="border-b border-slate-800 bg-slate-950/90 text-slate-400">
                      <tr>
                        <th className="px-3 py-2.5">Token</th>
                        <th className="px-3 py-2.5 text-right">Required (atomic)</th>
                        <th className="px-3 py-2.5 text-right">Funded (atomic)</th>
                        <th className="px-3 py-2.5 text-right">Deficit (atomic)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/80">
                      {funding.summary.map((item) => {
                        const t = findTokenByAddress(item.token_address)
                        return (
                          <tr
                            key={item.token_address}
                            className="transition hover:bg-slate-900/60"
                          >
                            <td className="px-3 py-2.5 align-middle">
                              {t ? t.symbol : item.token_address}
                            </td>
                            <td className="px-3 py-2.5 align-middle text-right font-mono">
                              {item.required}
                            </td>
                            <td className="px-3 py-2.5 align-middle text-right font-mono">
                              {item.funded}
                            </td>
                            <td className="px-3 py-2.5 align-middle text-right font-mono">
                              {item.deficit}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400">Loading funding…</p>
        )}
      </Card>

      {/* Lifecycle & leftovers */}
      <Card className="space-y-3 border border-slate-800/80 bg-slate-950/80 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Lifecycle & leftovers</h3>
        </div>

        <div className="grid gap-4 text-sm text-slate-200 md:grid-cols-3">
          <div className="space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-900/70 p-3.5">
            <p className="font-semibold text-slate-400 text-xs">Payroll status</p>
            <p className="font-mono text-xs">{payroll.status}</p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-900/70 p-3.5">
            <p className="font-semibold text-slate-400 text-xs">
              Leftover balance (default token)
            </p>
            {leftoversHuman != null ? (
              <p className="font-mono text-xs">
                {leftoversHuman} {token ? token.symbol : ''}
              </p>
            ) : (
              <p className="text-slate-500 text-xs">—</p>
            )}
          </div>

          <div className="space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-900/70 p-3.5">
            <p className="font-semibold text-slate-400 text-xs">Actions</p>
            <div className="flex flex-wrap gap-2">
              {payroll.status !== 'finalized' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleFinalizePayroll}
                  loading={finalizing || preparing.finalize}
                >
                  {preparedFinalize ? 'Finalize payroll' : preparing.finalize ? 'Preparing…' : 'Finalize payroll'}
                </Button>
              )}
              {leftoversHuman && parseFloat(leftoversHuman) > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleWithdrawLeftovers}
                  loading={withdrawing || preparing.withdraw}
                >
                  {preparedWithdraw ? 'Withdraw leftovers' : preparing.withdraw ? 'Preparing…' : 'Withdraw leftovers'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Finalize when all scheduled payments are done. After finalization, you can withdraw any leftover escrow.
        </p>
      </Card>

      {/* Payments */}
      <Card className="space-y-3 border border-slate-800/80 bg-slate-950/80 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Payments</h3>
          <p className="text-xs text-slate-400">Total {payments?.length ?? 0} rows</p>
        </div>

        {payments && payments.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/90">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-200">
                <thead className="border-b border-slate-800 bg-slate-950/90 text-slate-400">
                  <tr>
                    <th className="px-3 py-2.5">Index</th>
                    <th className="px-3 py-2.5">Employee</th>
                    <th className="px-3 py-2.5">Token</th>
                    <th className="px-3 py-2.5 text-right">Net (atomic)</th>
                    <th className="px-3 py-2.5 text-right">Tax (atomic)</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Tx</th>
                    <th className="px-3 py-2.5">Verify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/80">
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

                    const txLink =
                      explorerBase && fullTx ? `${explorerBase}/tx/${fullTx}` : null

                    return (
                      <tr key={p.id} className="transition hover:bg-slate-900/60">
                        <td className="px-3 py-2.5 align-middle font-mono text-xs">
                          {p.payroll_index}
                        </td>
                        <td className="px-3 py-2.5 align-middle font-mono text-xs">
                          {p.employee_address.slice(0, 6)}…{p.employee_address.slice(-4)}
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          {t ? t.symbol : p.token_address.slice(0, 6) + '…'}
                        </td>
                        <td className="px-3 py-2.5 align-middle text-right font-mono text-xs">
                          {p.net_amount_atomic}
                        </td>
                        <td className="px-3 py-2.5 align-middle text-right font-mono text-xs">
                          {p.tax_amount_atomic}
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <StatusPill status={p.status} />
                        </td>
                        <td className="px-3 py-2.5 align-middle font-mono text-xs">
                          {txLink && shortTx ? (
                            <a
                              href={txLink}
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-dotted"
                            >
                              {shortTx}
                            </a>
                          ) : (
                            shortTx ?? 'none'
                          )}
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => handleVerifyOnchain(p.id)}
                            disabled={verifyingId === p.id}
                          >
                            {verifyingId === p.id ? 'Verifying...' : 'Verify on-chain'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No payments found.</p>
        )}
      </Card>
    </div>
  )
}
