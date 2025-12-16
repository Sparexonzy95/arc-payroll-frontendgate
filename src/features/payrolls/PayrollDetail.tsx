// src/features/payrolls/PayrollDetail.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  usePayroll,
  usePayrollFunding,
  usePayrollPayments,
  useCreatePayrollOnchain,
} from '././hooks/hooks/usePayrolls'
import { useChains, useTokens } from '././hooks/useChains'
import { Card } from '././components/ui/Card'
import { Skeleton } from '././components/Skeleton'
import { StatusPill } from '././components/StatusPill'
import { Button } from '././components/ui/Button'
import { ChainBadge } from '././components/ChainBadge'
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
import type { TokenDTO } from '././api/chains'
import { api } from '././api/client'

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
      const msg =
        err?.shortMessage || err?.message || 'Failed to create payroll on-chain'
      toast.error(msg, { id: 'create-onchain' })
    } finally {
      setCreatingOnchain(false)
    }
  }

  /**
   * FUND PAYROLL (escrow + relayer gas)
   */
  async function handleFundPayroll() {
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
      const rewardPoolTotalNum =
        totalPayments > 0 ? rewardPerDispatchNum * totalPayments : 0

      const rewardPoolTotalHuman =
        rewardPoolTotalNum > 0
          ? rewardPoolTotalNum.toFixed(decimals)
          : '0'.padEnd(decimals + 2, '0')

      const rewardPoolAtomic =
        rewardPoolTotalNum > 0
          ? BigInt(Math.round(rewardPoolTotalNum * 10 ** decimals))
          : 0n

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

      let setRewardCall:
        | { to: string; data: string; chainId: number }
        | null = null
      let fundRewardCall:
        | { to: string; data: string; chainId: number }
        | null = null

      if (rewardPoolTotalNum > 0 && totalPayments > 0) {
        try {
          const resSet = await api.post(
            `/api/payrolls/payrolls/${dbId}/set_relayer_reward/`,
            {
              token_address: tokenAddress,
              reward_human: rewardPerDispatchHuman,
            }
          )
          setRewardCall = resSet.data

          const resReward = await api.post(
            `/api/payrolls/payrolls/${dbId}/fund_relayer_reward/`,
            {
              token_address: tokenAddress,
              amount_human: rewardPoolTotalHuman,
            }
          )
          fundRewardCall = resReward.data
        } catch (err: any) {
          console.error(
            'Relayer reward setup failed, continuing with escrow only',
            err
          )
          toast.error(
            'Relayer reward setup failed, funding escrow only. Check backend set_relayer_reward/fund_relayer_reward.'
          )
        }
      }

      const extraRewardAtomic =
        setRewardCall && fundRewardCall ? rewardPoolAtomic : 0n

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

      // 4) configure reward (optional) - raw calldata, must use sendRawCall
      if (setRewardCall) {
        toast.loading('Configuring relayer reward.', { id: 'fund' })
        await sendRawCall(setRewardCall, 'fund')
      }

      // 5) fund escrow - raw calldata, must use sendRawCall
      toast.loading(`Funding payroll with ${fundCall.deficit_human} units.`, {
        id: 'fund',
      })
      const hash = await sendRawCall(
        { to: fundCall.to, data: fundCall.data, chainId: fundCall.chainId },
        'fund'
      )

      // 6) fund reward pool (optional) - raw calldata
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

      toast.success(`Payroll funded! Tx: ${hash.slice(0, 10)}...`, {
        id: 'fund',
      })
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

      const res = await api.get(
        `/api/payrolls/payments/${paymentId}/verify_onchain/`
      )
      const data = res.data as {
        status_db: string
        onchain_is_processed: boolean | null
        receipt_status: number | null
        tx_hash?: string | null
        chain_name?: string
        chain_id?: number
      }

      if (data.onchain_is_processed && data.receipt_status === 1) {
        toast.success(
          `Verified on chain: processed on ${data.chain_name ?? 'chain'}`
        )
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

      toast.success(`Finalize submitted: ${hash.slice(0, 10)}...`, {
        id: 'finalize',
      })

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

      toast.success(`Withdraw submitted: ${hash.slice(0, 10)}...`, {
        id: 'withdraw',
      })

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

  // ---------------------------------------------
  // Loading / error states
  // ---------------------------------------------
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

  const chain = findChain()
  const token = findTokenByAddress(payroll.default_token_address)
  const explorerBase = getExplorerBaseUrl(chain?.chain_id)

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
                  · <span>{chain.name}</span>
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
            <p className="text-xs text-slate-300">
              {chain ? `${chain.name} (chainId ${chain.chain_id})` : 'Unknown'}
            </p>
          </div>

          <div className="space-y-1 text-sm text-slate-200">
            <p className="font-semibold text-slate-400">Default token</p>
            <p className="font-mono text-xs">
              {token ? token.symbol : 'Token'} ·{' '}
              {payroll.default_token_address?.slice(0, 6)}…
              {payroll.default_token_address?.slice(-4)}
            </p>
          </div>

          <div className="space-y-1 text-sm text-slate-200">
            <p className="font-semibold text-slate-400">Totals</p>
            <p className="font-mono text-xs">
              Net: {payroll.total_net_amount} · Tax: {payroll.total_tax_amount}
            </p>
            <p className="text-slate-500 text-xs">
              {payroll.total_payments} scheduled payments
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {payroll.status === 'draft' && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreateOnchain}
              disabled={creatingOnchain || txLock}
              loading={creatingOnchain || createOnchainMutation.isPending || txLock}
            >
              {creatingOnchain ? 'Creating…' : 'Create on-chain'}
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={handleFundPayroll}
            disabled={txLock}
          >
            Fund payroll
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleFinalizePayroll}
            disabled={finalizing || txLock}
            loading={finalizing || txLock}
          >
            Finalize
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleWithdrawLeftovers}
            disabled={withdrawing || txLock}
            loading={withdrawing || txLock}
          >
            Withdraw leftovers
          </Button>
        </div>

        {txLock && (
          <p className="text-[11px] text-slate-400">
            Transaction in progress. Please confirm in your wallet.
          </p>
        )}
      </Card>

      {/* Funding */}
      <Card className="space-y-3 border border-slate-800/80 bg-slate-950/80 p-5">
        <h3 className="text-base font-semibold text-slate-100">Funding</h3>

        {funding ? (
          funding.summary.length === 0 ? (
            <p className="text-sm text-slate-400">No funding summary yet.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/90">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-slate-200">
                  <thead className="border-b border-slate-800 bg-slate-950/90 text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5">Token</th>
                      <th className="px-3 py-2.5 text-right">Required</th>
                      <th className="px-3 py-2.5 text-right">Funded</th>
                      <th className="px-3 py-2.5 text-right">Deficit</th>
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
                          <td className="px-3 py-2.5">
                            {t ? t.symbol : item.token_address}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            {item.required}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            {item.funded}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            {item.deficit}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <p className="text-sm text-slate-400">Loading funding…</p>
        )}
      </Card>

      {/* Payments */}
      <Card className="space-y-3 border border-slate-800/80 bg-slate-950/80 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Payments</h3>
          <p className="text-xs text-slate-400">
            Total {payments?.length ?? 0} rows
          </p>
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
                    <th className="px-3 py-2.5 text-right">Net</th>
                    <th className="px-3 py-2.5 text-right">Tax</th>
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
                        <td className="px-3 py-2.5 font-mono">{p.payroll_index}</td>
                        <td className="px-3 py-2.5 font-mono">
                          {p.employee_address.slice(0, 6)}…{p.employee_address.slice(-4)}
                        </td>
                        <td className="px-3 py-2.5">
                          {t ? t.symbol : p.token_address.slice(0, 6) + '…'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {p.net_amount_atomic}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {p.tax_amount_atomic}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusPill status={p.status} />
                        </td>
                        <td className="px-3 py-2.5 font-mono">
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
                        <td className="px-3 py-2.5">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => handleVerifyOnchain(p.id)}
                            disabled={verifyingId === p.id}
                          >
                            {verifyingId === p.id ? 'Verifying...' : 'Verify'}
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
