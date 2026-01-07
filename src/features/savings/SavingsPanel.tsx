// src/features/savings/SavingsPanel.tsx
import { useMemo, useState } from 'react'
import { useAccount, usePublicClient, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import UsdcIcon from '../../assets/tokens/usdc.svg'
import EurcIcon from '../../assets/tokens/eurc.svg'

import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

import { useSavingsVault } from '../../hooks/hooks/useSavingsVault'
import { useUserSavings } from '../../hooks/hooks/useUserSavings'
import { ARC_CHAIN_ID, ARC_SAVINGS_VAULT } from '../../lib/config'
import { savingsVaultAbi } from '../../abi/savingsVault'
import { api } from '../../api/client'
// Arcflow theme
const CARD =
  'rounded-[18px] border border-subtle bg-surface-elevated'
const CARD_INSET =
  'rounded-[14px] border border-subtle bg-surface-sunken'
const SOFT_SHADOW = { boxShadow: '0 10px 28px rgba(2,6,23,0.06)' }

import {
  IconCoins,
  IconLock,
  IconWallet,
  IconArrowsExchange,
  IconLockBolt,
} from '@tabler/icons-react'

// USDC / EURC on Arc
const ARC_USDC = '0x3600000000000000000000000000000000000000' as `0x${string}`
const ARC_EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as `0x${string}`

type TokenChoice = 'USDC' | 'EURC'
type PlanType = 'flex' | 'fixed'

interface SavingRowData {
  id: string
  planType: PlanType // backend hint only, NOT source of truth
  tokenSymbol: TokenChoice
  createdAt: string
  maturesAt?: string | null
  closed: boolean
}

// Arcflow theme navy
const NAVY = '#0E2A55'

function getTokenAddress(symbol: TokenChoice): `0x${string}` {
  return symbol === 'USDC' ? ARC_USDC : ARC_EURC
}

function readPlanTypeFromStruct(savingStruct: any): number | null {
  if (!savingStruct) return null
  const raw = savingStruct.planType ?? savingStruct[2]
  if (raw === undefined || raw === null) return null
  try {
    return Number(raw)
  } catch {
    return null
  }
}

function readClosedFromStruct(savingStruct: any): boolean | null {
  if (!savingStruct) return null
  const raw = savingStruct.closed ?? savingStruct[7]
  if (raw === undefined || raw === null) return null
  return Boolean(raw)
}

function readCreatedAtFromStruct(savingStruct: any): number | null {
  if (!savingStruct) return null
  const raw = savingStruct.createdAt ?? savingStruct[3]
  if (raw === undefined || raw === null) return null
  try {
    return Number(raw)
  } catch {
    return null
  }
}

function readMaturesAtFromStruct(savingStruct: any): number | null {
  if (!savingStruct) return null
  const raw = savingStruct.maturesAt ?? savingStruct[4]
  if (raw === undefined || raw === null) return null
  try {
    return Number(raw)
  } catch {
    return null
  }
}

function readTokenFromStruct(savingStruct: any): `0x${string}` | null {
  if (!savingStruct) return null
  const raw = (savingStruct.token ?? savingStruct[1]) as `0x${string}` | undefined
  return raw ?? null
}

function tokenSymbolFromAddress(addr: string): TokenChoice {
  return addr.toLowerCase() === ARC_EURC.toLowerCase() ? 'EURC' : 'USDC'
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: any
  title: string
  value: string
  subtitle: string
}) {
  return (
   <Card className={`${CARD} p-5`} style={SOFT_SHADOW}>

      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200"
          style={{ color: NAVY }}
        >
          <Icon size={22} stroke={1.9} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </Card>
  )
}

export function SavingsPanel() {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID })
  const queryClient = useQueryClient()

  const { loading, createSaving, deposit, withdrawFlex, withdrawFixed } = useSavingsVault()
  const { data: savingsFromBackend, isLoading: savingsLoading } = useUserSavings()

  const savings: SavingRowData[] = (savingsFromBackend || []).map((s: any) => ({
    id: s.id,
    planType: s.planType,
    tokenSymbol: s.tokenSymbol,
    createdAt: s.createdAt,
    maturesAt: s.maturesAt,
    closed: s.closed,
  }))

  // Only show stats we can guarantee with current functionality
  const stats = useMemo(() => {
    const total = savings.length
    const fixed = savings.filter((s) => s.planType === 'fixed').length
    const flex = savings.filter((s) => s.planType === 'flex').length
    return { total, fixed, flex }
  }, [savings])

  // Create new saving form state (existing functionality)
  const [planType, setPlanType] = useState<PlanType>('flex')
  const [tokenChoice, setTokenChoice] = useState<TokenChoice>('USDC')
  const [newAmount, setNewAmount] = useState('')
  const [fixedDays, setFixedDays] = useState('30')

  const disabled = !address || loading
  const walletLabel = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  // Record from on-chain truth (existing functionality)
  async function recordSavingOnBackend(savingId: bigint) {
    if (!address || !publicClient) return
    try {
      const savingStruct = await publicClient.readContract({
        address: ARC_SAVINGS_VAULT,
        abi: savingsVaultAbi,
        functionName: 'savings',
        args: [savingId],
      })

      const planTypeOnchain = readPlanTypeFromStruct(savingStruct as any)
      const tokenOnchain = readTokenFromStruct(savingStruct as any)
      const createdAtSec = readCreatedAtFromStruct(savingStruct as any)
      const maturesAtSec = readMaturesAtFromStruct(savingStruct as any)

      const plan_type: PlanType =
        planTypeOnchain === 0 ? 'flex' : planTypeOnchain === 1 ? 'fixed' : 'flex'

      const token_address = tokenOnchain ?? getTokenAddress(tokenChoice)
      const token_symbol = tokenSymbolFromAddress(token_address)

      const created_at = createdAtSec
        ? new Date(createdAtSec * 1000).toISOString()
        : new Date().toISOString()

      const matures_at =
        plan_type === 'fixed' && maturesAtSec && maturesAtSec > 0
          ? new Date(maturesAtSec * 1000).toISOString()
          : null

      await api.post('/api/savings/', {
        chain_id: ARC_CHAIN_ID,
        owner_address: address,
        saving_id: savingId.toString(),
        token_address,
        token_symbol,
        plan_type,
        created_at,
        matures_at,
        closed: false,
      })

      await queryClient.invalidateQueries({ queryKey: ['user-savings', address] })
    } catch (e: any) {
      console.error('Failed to record saving in backend', e)
      toast.error('Saving created on-chain, but backend index failed. Check logs.')
    }
  }

  async function handleCreate() {
    if (!address) return toast.error('Connect wallet first.')
    if (!newAmount) return toast.error('Enter an amount.')

    try {
      let maturesAt: number | undefined

      if (planType === 'fixed') {
        const days = Number(fixedDays)
        if (!Number.isFinite(days) || days <= 0) return toast.error('Days must be positive.')
        const nowSec = Math.floor(Date.now() / 1000)
        maturesAt = nowSec + days * 86400
      }

      const id = await createSaving({
        token: getTokenAddress(tokenChoice),
        planType,
        maturesAt,
      })

      await deposit({ savingId: id, amount: newAmount })
      await recordSavingOnBackend(id)

      setNewAmount('')
      toast.success(`Vault #${id} created and funded.`)
    } catch (e: any) {
      toast.error(e?.message || 'Error creating saving.')
    }
  }

  return (
    <div className="space-y-5 md:space-y-6">
  {/* Overview */}
  <div>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-ink-primary">Overview</h3>

      {address ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface-sunken px-3 py-1">
          <span className="text-[11px] uppercase tracking-wide text-ink-muted">
            Wallet
          </span>
          <span className="font-mono text-xs text-ink-primary">
            {walletLabel}
          </span>
        </div>
      ) : (
        <span className="text-[11px] text-ink-muted">
          Connect wallet to manage vaults
        </span>
      )}
    </div>


        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={IconCoins}
            title="Total vaults"
            value={address ? String(stats.total) : '—'}
            subtitle="Indexed from backend list"
          />
          <StatCard
            icon={IconLock}
            title="Locked (Fixed)"
            value={address ? String(stats.fixed) : '—'}
            subtitle="Fixed vault count"
          />
          <StatCard
            icon={IconWallet}
            title="Available (Flex)"
            value={address ? String(stats.flex) : '—'}
            subtitle="Flex vault count"
          />
        </div>
      </div>

      {/* Savings vaults (allocate + create) */}
     <Card className={`${CARD} p-5`} style={SOFT_SHADOW}>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Savings vaults</h3>
          <div className="text-xs text-slate-500">Create + fund a vault below</div>
        </div>

        {/* Allocation header (FULL WIDTH, CLEAN) */}
<div className="mt-4 w-full rounded-2xl border border-subtle bg-surface-elevated px-5 py-4">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    {/* Title + description */}
    <div className="min-w-0">
      <h4 className="text-[15px] font-semibold text-ink-primary">
        Allocate funds to a savings vault
      </h4>

      <p className="mt-1 text-xs text-ink-soft">
        {planType === 'flex'
          ? 'Flex vaults allow withdrawals at any time.'
          : 'Fixed vaults lock funds until maturity.'}
      </p>
    </div>

    {/* Plan selector tabs */}
    <div
      className="inline-flex w-full sm:w-auto rounded-full border border-subtle bg-surface-sunken p-1"
      role="tablist"
    >
      <button
        type="button"
        role="tab"
        aria-selected={planType === 'flex'}
        onClick={() => setPlanType('flex')}
        className={[
          'px-5 py-2 text-sm font-medium rounded-full transition-all',
          planType === 'flex'
            ? 'bg-surface-elevated text-ink-primary shadow-soft'
            : 'text-ink-soft hover:text-ink-primary',
        ].join(' ')}
      >
        Flex Vault
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={planType === 'fixed'}
        onClick={() => setPlanType('fixed')}
        className={[
          'px-5 py-2 text-sm font-medium rounded-full transition-all',
          planType === 'fixed'
            ? 'bg-surface-elevated text-ink-primary shadow-soft'
            : 'text-ink-soft hover:text-ink-primary',
        ].join(' ')}
      >
        Fixed Vault
      </button>
    </div>
  </div>



         {/* Create + fund (real functionality) */}
<div className="mt-4 w-full rounded-2xl border border-subtle bg-surface-elevated p-5">
  <div className="space-y-5">
    {/* Token selector */}
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        Token
      </label>

      <div
        className="flex w-full rounded-full border border-subtle bg-surface-sunken p-1"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tokenChoice === 'USDC'}
          onClick={() => setTokenChoice('USDC')}
          className={[
            'flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
            tokenChoice === 'USDC'
              ? 'bg-surface-elevated text-ink-primary shadow-soft'
              : 'text-ink-soft hover:text-ink-primary',
          ].join(' ')}
        >
          <img src={UsdcIcon} alt="USDC" className="h-4 w-4" />
          USDC
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tokenChoice === 'EURC'}
          onClick={() => setTokenChoice('EURC')}
          className={[
            'flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
            tokenChoice === 'EURC'
              ? 'bg-surface-elevated text-ink-primary shadow-soft'
              : 'text-ink-soft hover:text-ink-primary',
          ].join(' ')}
        >
          <img src={EurcIcon} alt="EURC" className="h-4 w-4" />
          EURC
        </button>
      </div>

      <p className="text-[11px] text-ink-soft">
        {tokenChoice} on Arc network
      </p>
    </div>

    {/* Amount */}
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        Amount ({tokenChoice})
      </label>

      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={newAmount}
        onChange={(e) => setNewAmount(e.target.value)}
        className="h-11 text-base"
      />
    </div>

    {/* Fixed vault lock period */}
    {planType === 'fixed' && (
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Lock period
        </label>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            step="1"
            value={fixedDays}
            onChange={(e) => setFixedDays(e.target.value)}
            className="h-11 w-32 text-base"
          />
          <span className="text-sm text-ink-soft">days</span>
        </div>
      </div>
    )}

    {/* Info + action */}
    <div className="rounded-xl border border-subtle bg-surface-sunken px-4 py-3">
      <p className="text-xs text-ink-soft">
        {planType === 'fixed'
          ? 'Fixed vaults lock funds until maturity. Withdraw becomes available after release.'
          : 'Flex vaults allow withdrawals at any time.'}
      </p>
    </div>

    <div className="flex justify-end">
      <Button disabled={disabled} onClick={handleCreate}>
        {loading ? 'Working…' : 'Create vault and allocate funds'}
      </Button>
    </div>
  </div>
</div>
</div>
      </Card>

      {/* Your savings */}
      <Card className={`${CARD} p-5`} style={SOFT_SHADOW}>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Your vault positions</h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['user-savings', address] })}
            disabled={!address}
          >
            Refresh
          </Button>
        </div>

        {!address && (
          <p className="mt-3 text-xs text-slate-500">Connect your wallet to view your vault positions.</p>
        )}

        {address && savingsLoading && (
          <p className="mt-3 text-xs text-slate-500">Loading your savings from backend index…</p>
        )}

        {address && !savingsLoading && savings.length === 0 && (
          <p className="mt-3 text-xs text-slate-500">No vaults yet. Create one above to get started.</p>
        )}

        {address && savings.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="md:hidden space-y-3">
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

            <div className="hidden md:block">
              <SavingsTable
                savings={savings}
                deposit={deposit}
                withdrawFlex={withdrawFlex}
                withdrawFixed={withdrawFixed}
                disabled={disabled}
              />
            </div>
          </div>
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
    <div className={`${CARD_INSET} overflow-auto`}>

      <table className="min-w-full text-sm">
        <thead className="bg-surface-sunken text-ink-muted">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Token</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Available</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Created</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Release date</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
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

  const { data: availableRaw, isLoading: availLoad, refetch: refAvail } = useReadContract({
    address: ARC_SAVINGS_VAULT,
    abi: savingsVaultAbi,
    functionName: 'getAvailable',
    args: [savingIdBig],
    chainId: ARC_CHAIN_ID,
  })

  const { data: savingStruct, isLoading: structLoad, refetch: refSave } = useReadContract({
    address: ARC_SAVINGS_VAULT,
    abi: savingsVaultAbi,
    functionName: 'savings',
    args: [savingIdBig],
    chainId: ARC_CHAIN_ID,
  })

  const planTypeOnchain = readPlanTypeFromStruct(savingStruct as any)
  const isFlex = planTypeOnchain === 0
  const isFixed = planTypeOnchain === 1

  const closedOnchain = readClosedFromStruct(savingStruct as any)
  const closed = closedOnchain !== null ? closedOnchain : saving.closed

  const planLabel: PlanType =
    planTypeOnchain === 0 ? 'flex' : planTypeOnchain === 1 ? 'fixed' : saving.planType

  const maturesAtSec = readMaturesAtFromStruct(savingStruct as any)
  const nowSec = Math.floor(Date.now() / 1000)
  const matured = maturesAtSec !== null && maturesAtSec > 0 ? maturesAtSec <= nowSec : false

  const releaseLabel =
    planTypeOnchain === 1 && maturesAtSec && maturesAtSec > 0
      ? new Date(maturesAtSec * 1000).toLocaleDateString()
      : '—'

  const available = availableRaw ? BigInt(availableRaw as any) : 0n
  const availableHuman = formatUnits(available, 6)

  const busy = disabled || availLoad || structLoad

  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')

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
      toast.error(e?.message || 'Deposit failed.')
    }
  }

  async function doFlexWithdraw() {
    if (!amount) return toast.error('Enter amount.')
    if (planTypeOnchain !== null && !isFlex) return toast.error('This vault is not a flex plan.')
    try {
      await withdrawFlex({ savingId: savingIdBig, amount })
      await refresh()
      toast.success('Withdraw successful.')
      setEditing(false)
      setAmount('')
    } catch (e: any) {
      toast.error(e?.message || 'Withdraw failed.')
    }
  }

  async function doFixedWithdraw() {
    if (planTypeOnchain !== null && !isFixed) return toast.error('This vault is not a fixed plan.')
    try {
      await withdrawFixed(savingIdBig)
      await refresh()
      toast.success('Withdraw successful.')
    } catch (e: any) {
      toast.error(e?.message || 'Withdraw failed.')
    }
  }

  const canShowActions = planTypeOnchain !== null

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-slate-700">#{saving.id}</td>
      <td className="px-4 py-3 text-slate-900">{saving.tokenSymbol}</td>

      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          {planLabel === 'flex' ? (
            <IconWallet size={14} stroke={1.9} style={{ color: NAVY }} />
          ) : (
            <IconLock size={14} stroke={1.9} style={{ color: NAVY }} />
          )}
          <span className="capitalize">{planLabel}</span>
          {closed ? <span className="text-slate-400">· Closed</span> : null}
          {planTypeOnchain === null ? <span className="text-slate-400">· Syncing</span> : null}
        </span>
      </td>

      <td className="px-4 py-3 text-slate-900">
        {availLoad ? '…' : `${availableHuman} ${saving.tokenSymbol}`}
      </td>

      <td className="px-4 py-3 text-xs text-slate-500">{new Date(saving.createdAt).toLocaleString()}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{releaseLabel}</td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {editing && !closed && (
            <Input
              type="number"
              min="0"
              step="0.01"
              className="h-9 w-28 text-sm"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}

          {!editing && !closed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditing(true)
                setAmount('')
              }}
            >
              Amount
            </Button>
          )}

          {!closed && (
            <Button size="sm" variant="secondary" disabled={busy || !editing} onClick={doDeposit}>
              Deposit
            </Button>
          )}

          {canShowActions && isFlex && !closed && (
            <Button size="sm" variant="secondary" disabled={busy || !editing} onClick={doFlexWithdraw}>
              Withdraw
            </Button>
          )}

          {canShowActions && isFixed && !closed && (
            <Button size="sm" disabled={busy || !matured} onClick={doFixedWithdraw}>
              Withdraw
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

  const { data: availableRaw, isLoading: availLoad, refetch: refAvail } = useReadContract({
    address: ARC_SAVINGS_VAULT,
    abi: savingsVaultAbi,
    functionName: 'getAvailable',
    args: [savingIdBig],
    chainId: ARC_CHAIN_ID,
  })

  const { data: savingStruct, isLoading: structLoad, refetch: refSave } = useReadContract({
    address: ARC_SAVINGS_VAULT,
    abi: savingsVaultAbi,
    functionName: 'savings',
    args: [savingIdBig],
    chainId: ARC_CHAIN_ID,
  })

  const planTypeOnchain = readPlanTypeFromStruct(savingStruct as any)
  const isFlex = planTypeOnchain === 0
  const isFixed = planTypeOnchain === 1

  const closedOnchain = readClosedFromStruct(savingStruct as any)
  const closed = closedOnchain !== null ? closedOnchain : saving.closed

  const planLabel: PlanType =
    planTypeOnchain === 0 ? 'flex' : planTypeOnchain === 1 ? 'fixed' : saving.planType

  const maturesAtSec = readMaturesAtFromStruct(savingStruct as any)
  const nowSec = Math.floor(Date.now() / 1000)
  const matured = maturesAtSec !== null && maturesAtSec > 0 ? maturesAtSec <= nowSec : false

  const releaseLabel =
    planTypeOnchain === 1 && maturesAtSec && maturesAtSec > 0
      ? new Date(maturesAtSec * 1000).toLocaleDateString()
      : '—'

  const available = availableRaw ? BigInt(availableRaw as any) : 0n
  const availableHuman = formatUnits(available, 6)

  const busy = disabled || availLoad || structLoad

  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')

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
      toast.error(e?.message || 'Deposit failed.')
    }
  }

  async function doFlexWithdraw() {
    if (!amount) return toast.error('Enter amount.')
    if (planTypeOnchain !== null && !isFlex) return toast.error('This vault is not a flex plan.')
    try {
      await withdrawFlex({ savingId: savingIdBig, amount })
      await refresh()
      toast.success('Withdraw successful.')
      setEditing(false)
      setAmount('')
    } catch (e: any) {
      toast.error(e?.message || 'Withdraw failed.')
    }
  }

  async function doFixedWithdraw() {
    if (planTypeOnchain !== null && !isFixed) return toast.error('This vault is not a fixed plan.')
    try {
      await withdrawFixed(savingIdBig)
      await refresh()
      toast.success('Withdraw successful.')
    } catch (e: any) {
      toast.error(e?.message || 'Withdraw failed.')
    }
  }

  const canShowActions = planTypeOnchain !== null

  return (
    <div className={`${CARD} p-4`} style={SOFT_SHADOW}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-slate-500">#{saving.id}</p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {saving.tokenSymbol}{' '}
            <span className="text-xs font-normal text-slate-500">· {planLabel}</span>
          </p>

          <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
            {planLabel === 'flex' ? (
              <IconWallet size={14} stroke={1.9} style={{ color: NAVY }} />
            ) : (
              <IconLock size={14} stroke={1.9} style={{ color: NAVY }} />
            )}
            <span className="capitalize">{planLabel}</span>
            {closed ? <span className="text-slate-400">· Closed</span> : null}
            {planTypeOnchain === null ? <span className="text-slate-400">· Syncing</span> : null}
          </span>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500">Available</p>
          <p className="mt-1 font-mono text-sm text-slate-900">
            {availLoad ? '…' : `${availableHuman} ${saving.tokenSymbol}`}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Created</p>
          <p className="mt-1">{new Date(saving.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Release</p>
          <p className="mt-1">{releaseLabel}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {editing && !closed && (
          <Input
            type="number"
            min="0"
            step="0.01"
            className="h-10 w-full text-sm"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!editing && !closed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditing(true)
                setAmount('')
              }}
            >
              Set amount
            </Button>
          )}

          {!closed && (
            <Button size="sm" variant="secondary" disabled={busy || !editing} onClick={doDeposit}>
              Deposit
            </Button>
          )}

          {canShowActions && isFlex && !closed && (
            <Button size="sm" variant="secondary" disabled={busy || !editing} onClick={doFlexWithdraw}>
              Withdraw
            </Button>
          )}

          {canShowActions && isFixed && !closed && (
            <Button size="sm" disabled={busy || !matured} onClick={doFixedWithdraw}>
              Withdraw
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
