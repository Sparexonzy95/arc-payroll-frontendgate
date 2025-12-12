// src/features/savings/SavingsPanel.tsx
import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

import { useSavingsVault } from '../../hooks/hooks/useSavingsVault'
import { useUserSavings } from '../../hooks/hooks/useUserSavings'
import { ARC_CHAIN_ID, ARC_SAVINGS_VAULT } from '../../lib/config'
import { savingsVaultAbi } from '../../abi/savingsVault'
import { api } from '../../api/client'

import { PiggyBank, Lock, Wallet } from 'lucide-react'

// USDC / EURC on Arc
const ARC_USDC = '0x3600000000000000000000000000000000000000' as `0x${string}`
const ARC_EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as `0x${string}`

type TokenChoice = 'USDC' | 'EURC'
type PlanType = 'flex' | 'fixed'

interface SavingRowData {
  id: string
  planType: PlanType
  tokenSymbol: TokenChoice
  createdAt: string
  maturesAt?: string | null
  closed: boolean
}

function getTokenAddress(symbol: TokenChoice): `0x${string}` {
  return symbol === 'USDC' ? ARC_USDC : ARC_EURC
}

export function SavingsPanel() {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  const { loading, createSaving, deposit, withdrawFlex, withdrawFixed } =
    useSavingsVault()

  const {
    data: savingsFromBackend,
    isLoading: savingsLoading,
  } = useUserSavings()

  const savings: SavingRowData[] = (savingsFromBackend || []).map((s) => ({
    id: s.id,
    planType: s.planType,
    tokenSymbol: s.tokenSymbol,
    createdAt: s.createdAt,
    maturesAt: s.maturesAt,
    closed: s.closed,
  }))

  // create new saving form state
  const [planType, setPlanType] = useState<PlanType>('flex')
  const [tokenChoice, setTokenChoice] = useState<TokenChoice>('USDC')
  const [newAmount, setNewAmount] = useState('')
  const [fixedDays, setFixedDays] = useState('30')

  const disabled = !address || loading

  async function recordSavingOnBackend(args: {
    savingId: bigint
    planType: PlanType
    tokenChoice: TokenChoice
    createdAtIso: string
    maturesIso?: string
  }) {
    if (!address) return

    try {
      await api.post('/api/savings/', {
        chain_id: ARC_CHAIN_ID,
        owner_address: address,
        saving_id: args.savingId.toString(),
        token_address: getTokenAddress(args.tokenChoice),
        token_symbol: args.tokenChoice,
        plan_type: args.planType,
        created_at: args.createdAtIso,
        matures_at: args.maturesIso ?? null,
        closed: false,
      })

      await queryClient.invalidateQueries({
        queryKey: ['user-savings', address],
      })
    } catch (e: any) {
      console.error('Failed to record saving in backend', e)
      toast.error(
        'Saving created on-chain, but backend index failed. Check logs.',
      )
    }
  }

  async function handleCreate() {
    if (!address) return toast.error('Connect wallet first.')
    if (!newAmount) return toast.error('Enter an amount.')

    try {
      let maturesAt: number | undefined
      let maturesIso: string | undefined

      if (planType === 'fixed') {
        const days = Number(fixedDays)
        if (days <= 0) return toast.error('Days must be positive.')

        const nowSec = Math.floor(Date.now() / 1000)
        maturesAt = nowSec + days * 86400
        maturesIso = new Date(maturesAt * 1000).toISOString()
      }

      const createdIso = new Date().toISOString()

      const id = await createSaving({
        token: getTokenAddress(tokenChoice),
        planType,
        maturesAt,
      })

      await deposit({ savingId: id, amount: newAmount })

      // record in backend index
      await recordSavingOnBackend({
        savingId: id,
        planType,
        tokenChoice,
        createdAtIso: createdIso,
        maturesIso,
      })

      setNewAmount('')
      toast.success(`Saving #${id} created.`)
    } catch (e: any) {
      toast.error(e.message || 'Error creating saving.')
    }
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* PANEL 1 - HERO */}
      <Card className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#164c90] via-[#1a5bab] to-[#0c2b51] px-4 py-5 sm:px-6 sm:py-6 shadow-xl shadow-black/40">
        <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/20 ring-1 ring-[#4189e1]/60">
            <PiggyBank className="h-7 w-7 text-[#e3eefa]" />
          </div>
          <div className="max-w-2xl">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#e3eefa]">
              Piggyvest savings vault
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#e3eefa]/80">
              Create flexible or fixed USDC/EURC savings on Arc. Your savings
              list is indexed on the backend so it survives clearing your
              browser.
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[#4189e1]/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#0e305a]/40 blur-3xl" />
      </Card>

      {/* PANEL 2 - CREATE NEW SAVING */}
      <Card className="space-y-5 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 shadow-lg shadow-black/30">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-200">
            Start a new savings plan
          </h3>
          {address && (
            <p className="text-[11px] text-slate-500">
              Wallet: <span className="font-mono">{address.slice(0, 6)}…{address.slice(-4)}</span>
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Plan type */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wide text-slate-400">
              Plan type
            </label>

            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/80 p-1">
              <button
                type="button"
                onClick={() => setPlanType('flex')}
                className={`flex-1 rounded-lg px-3 py-1 text-xs transition ${
                  planType === 'flex'
                    ? 'bg-[#e3eefa] text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300'
                }`}
              >
                Flex
              </button>

              <button
                type="button"
                onClick={() => setPlanType('fixed')}
                className={`flex-1 rounded-lg px-3 py-1 text-xs transition ${
                  planType === 'fixed'
                    ? 'bg-[#e3eefa] text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300'
                }`}
              >
                Fixed
              </button>
            </div>
          </div>

          {/* Token */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wide text-slate-400">
              Token
            </label>
            <select
              value={tokenChoice}
              onChange={(e) => setTokenChoice(e.target.value as TokenChoice)}
              className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#4189e1]"
            >
              <option value="USDC">USDC (Arc)</option>
              <option value="EURC">EURC (Arc)</option>
            </select>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wide text-slate-400">
              Amount ({tokenChoice})
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {planType === 'fixed' && (
          <div className="flex flex-col gap-1 md:w-48">
            <label className="text-[11px] uppercase tracking-wide text-slate-400">
              Lock period (days)
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={fixedDays}
              onChange={(e) => setFixedDays(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        <Button disabled={disabled} onClick={handleCreate} className="w-full md:w-auto">
          {loading ? 'Working…' : 'Create and fund saving'}
        </Button>
      </Card>

      {/* PANEL 3 - SAVINGS TABLE / CARDS */}
      <Card className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 shadow-lg shadow-black/30">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Your savings
        </h3>

        {!address && (
          <p className="text-[11px] sm:text-xs text-slate-500">
            Connect your wallet to view your savings positions.
          </p>
        )}

        {address && savingsLoading && (
          <p className="text-[11px] sm:text-xs text-slate-500">
            Loading your savings from backend index...
          </p>
        )}

        {address && !savingsLoading && savings.length === 0 && (
          <p className="text-[11px] sm:text-xs text-slate-500">
            No savings yet. Create a plan above to get started.
          </p>
        )}

        {address && savings.length > 0 && (
          <>
            {/* MOBILE CARDS */}
            <div className="space-y-3 sm:space-y-4 md:hidden">
              {savings.map((s) => (
                <SavingCard
                  key={s.id}
                  saving={s}
                  disabled={disabled}
                  deposit={deposit}
                  withdrawFlex={withdrawFlex}
                  withdrawFixed={withdrawFixed}
                />
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
              <SavingsTable
                savings={savings}
                deposit={deposit}
                withdrawFlex={withdrawFlex}
                withdrawFixed={withdrawFixed}
                disabled={disabled}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

/* DESKTOP TABLE */

function SavingsTable({
  savings,
  deposit,
  withdrawFlex,
  withdrawFixed,
  disabled,
}: {
  savings: SavingRowData[]
  deposit: any
  withdrawFlex: any
  withdrawFixed: any
  disabled: boolean
}) {
  return (
    <div className="overflow-auto rounded-2xl border border-slate-800 bg-slate-950/60">
      <table className="min-w-full text-xs text-slate-200">
        <thead className="bg-[#0c2b51] text-slate-200">
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
              ID
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
              Token
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
              Type
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
              Available
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
              Created
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
              Release date
            </th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-900 bg-slate-950/60">
          {savings.map((s) => (
            <SavingRow
              key={s.id}
              saving={s}
              disabled={disabled}
              deposit={deposit}
              withdrawFlex={withdrawFlex}
              withdrawFixed={withdrawFixed}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* DESKTOP ROW */

function SavingRow({
  saving,
  disabled,
  deposit,
  withdrawFlex,
  withdrawFixed,
}: {
  saving: SavingRowData
  disabled: boolean
  deposit: any
  withdrawFlex: any
  withdrawFixed: any
}) {
  const savingIdBig = BigInt(saving.id)

  const {
    data: availableRaw,
    isLoading: availLoad,
    refetch: refAvail,
  } = useReadContract({
    address: ARC_SAVINGS_VAULT,
    abi: savingsVaultAbi,
    functionName: 'getAvailable',
    args: [savingIdBig],
    chainId: ARC_CHAIN_ID,
  })

  const {
    data: savingStruct,
    isLoading: structLoad,
    refetch: refSave,
  } = useReadContract({
    address: ARC_SAVINGS_VAULT,
    abi: savingsVaultAbi,
    functionName: 'savings',
    args: [savingIdBig],
    chainId: ARC_CHAIN_ID,
  })

  const closed = savingStruct
    ? Boolean((savingStruct as any).closed ?? (savingStruct as any)[7])
    : saving.closed

  const available = availableRaw ? BigInt(availableRaw as any) : 0n
  const availableHuman = formatUnits(available, 6)

  const busy = disabled || availLoad || structLoad

  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')

  const now = Date.now()
  const matured = saving.maturesAt
    ? new Date(saving.maturesAt).getTime() <= now
    : false

  async function refresh() {
    await Promise.all([refAvail(), refSave()])
  }

  async function doDeposit() {
    if (!amount) return toast.error('Enter amount.')
    try {
      await deposit({ savingId: savingIdBig, amount })
      await refresh()
      toast.success('Deposit successful.')
      setEditing(false)
      setAmount('')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function doFlexWithdraw() {
    if (!amount) return toast.error('Enter amount.')
    try {
      await withdrawFlex({ savingId: savingIdBig, amount })
      await refresh()
      toast.success('Flex withdrawal done.')
      setEditing(false)
      setAmount('')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function doFixedWithdraw() {
    try {
      await withdrawFixed(savingIdBig)
      await refresh()
      toast.success('Fixed withdrawal done.')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <tr className="transition-colors hover:bg-slate-900/60">
      <td className="px-3 py-2 font-mono text-[11px] text-slate-100">
        #{saving.id}
      </td>
      <td className="px-3 py-2 text-slate-200">{saving.tokenSymbol}</td>

      <td className="px-3 py-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-100">
          {saving.planType === 'flex' ? (
            <Wallet className="h-3 w-3 text-[#92bbee]" />
          ) : (
            <Lock className="h-3 w-3 text-[#92bbee]" />
          )}
          {saving.planType}
          {closed ? ' · Closed' : ''}
        </span>
      </td>

      <td className="px-3 py-2 text-slate-200">
        {availLoad ? '…' : `${availableHuman} ${saving.tokenSymbol}`}
      </td>

      <td className="px-3 py-2 text-[10px] text-slate-400">
        {new Date(saving.createdAt).toLocaleString()}
      </td>

      <td className="px-3 py-2 text-[10px] text-slate-400">
        {saving.maturesAt
          ? new Date(saving.maturesAt).toLocaleDateString()
          : '—'}
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-2">
          {editing && !closed && (
            <Input
              type="number"
              min="0"
              step="0.01"
              className="h-7 w-24 text-[11px]"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}

          {!editing && !closed && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setEditing(true)
                setAmount('')
              }}
            >
              Amount
            </Button>
          )}

          {!closed && (
            <Button
              size="xs"
              variant="secondary"
              disabled={busy || !editing}
              onClick={doDeposit}
            >
              Deposit
            </Button>
          )}

          {saving.planType === 'flex' && !closed && (
            <Button
              size="xs"
              variant="secondary"
              disabled={busy || !editing}
              onClick={doFlexWithdraw}
            >
              Withdraw flex
            </Button>
          )}

          {saving.planType === 'fixed' && !closed && (
            <Button
              size="xs"
              disabled={busy || !matured}
              onClick={doFixedWithdraw}
            >
              Withdraw fixed
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

/* MOBILE CARD */

function SavingCard({
  saving,
  disabled,
  deposit,
  withdrawFlex,
  withdrawFixed,
}: {
  saving: SavingRowData
  disabled: boolean
  deposit: any
  withdrawFlex: any
  withdrawFixed: any
}) {
  const savingIdBig = BigInt(saving.id)

  const {
    data: availableRaw,
    isLoading: availLoad,
    refetch: refAvail,
  } = useReadContract({
    address: ARC_SAVINGS_VAULT,
    abi: savingsVaultAbi,
    functionName: 'getAvailable',
    args: [savingIdBig],
    chainId: ARC_CHAIN_ID,
  })

  const {
    data: savingStruct,
    isLoading: structLoad,
    refetch: refSave,
  } = useReadContract({
    address: ARC_SAVINGS_VAULT,
    abi: savingsVaultAbi,
    functionName: 'savings',
    args: [savingIdBig],
    chainId: ARC_CHAIN_ID,
  })

  const closed = savingStruct
    ? Boolean((savingStruct as any).closed ?? (savingStruct as any)[7])
    : saving.closed

  const available = availableRaw ? BigInt(availableRaw as any) : 0n
  const availableHuman = formatUnits(available, 6)

  const busy = disabled || availLoad || structLoad

  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')

  const now = Date.now()
  const matured = saving.maturesAt
    ? new Date(saving.maturesAt).getTime() <= now
    : false

  async function refresh() {
    await Promise.all([refAvail(), refSave()])
  }

  async function doDeposit() {
    if (!amount) return toast.error('Enter amount.')
    try {
      await deposit({ savingId: savingIdBig, amount })
      await refresh()
      toast.success('Deposit successful.')
      setEditing(false)
      setAmount('')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function doFlexWithdraw() {
    if (!amount) return toast.error('Enter amount.')
    try {
      await withdrawFlex({ savingId: savingIdBig, amount })
      await refresh()
      toast.success('Flex withdrawal done.')
      setEditing(false)
      setAmount('')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function doFixedWithdraw() {
    try {
      await withdrawFixed(savingIdBig)
      await refresh()
      toast.success('Fixed withdrawal done.')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4">
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-mono text-slate-400">#{saving.id}</p>
          <p className="text-sm font-semibold text-slate-100">
            {saving.tokenSymbol}{' '}
            <span className="text-[11px] font-normal text-slate-400">
              · {saving.planType}
            </span>
          </p>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-100">
            {saving.planType === 'flex' ? (
              <Wallet className="h-3 w-3 text-[#92bbee]" />
            ) : (
              <Lock className="h-3 w-3 text-[#92bbee]" />
            )}
            {saving.planType}
            {closed ? ' · Closed' : ''}
          </span>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-500">Available</p>
          <p className="font-mono text-[13px] text-slate-100">
            {availLoad ? '…' : `${availableHuman} ${saving.tokenSymbol}`}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-400">
        <div>
          <p className="uppercase tracking-wide text-[9px] text-slate-500">
            Created
          </p>
          <p>{new Date(saving.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="uppercase tracking-wide text-[9px] text-slate-500">
            Release
          </p>
          <p>
            {saving.maturesAt
              ? new Date(saving.maturesAt).toLocaleDateString()
              : '—'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 space-y-2">
        {editing && !closed && (
          <Input
            type="number"
            min="0"
            step="0.01"
            className="h-9 w-full text-[12px]"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!editing && !closed && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setEditing(true)
                setAmount('')
              }}
            >
              Set amount
            </Button>
          )}

          {!closed && (
            <Button
              size="xs"
              variant="secondary"
              disabled={busy || !editing}
              onClick={doDeposit}
            >
              Deposit
            </Button>
          )}

          {saving.planType === 'flex' && !closed && (
            <Button
              size="xs"
              variant="secondary"
              disabled={busy || !editing}
              onClick={doFlexWithdraw}
            >
              Withdraw flex
            </Button>
          )}

          {saving.planType === 'fixed' && !closed && (
            <Button
              size="xs"
              disabled={busy || !matured}
              onClick={doFixedWithdraw}
            >
              Withdraw fixed
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
