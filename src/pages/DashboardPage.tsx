// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useBalance, useConnect } from 'wagmi'

import {
  Briefcase,
  ArrowLeftRight,
  PiggyBank,
  ShieldCheck,
  Coins,
  Menu,
  X,
  Wallet,
  ArrowRight,
} from 'lucide-react'

import { EmployerOnboarding } from '../features/employer/EmployerOnboarding'
import { EmployerSelector } from '../features/employer/EmployerSelector'
import { GatewayBalancesPanel } from '../features/gateway/GatewayBalancesPanel'
import { GatewayTransferForm } from '../features/gateway/GatewayTransferForm'
import { GatewayDepositForm } from '../features/gateway/GatewayDepositForm'
import { SavingsPanel } from '../features/savings/SavingsPanel'
import { WalletBalancesPanel } from '../features/gateway/WalletBalancesPanel'

import { useWalletEmployerBinding } from '../hooks/useWalletEmployerBinding'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ARC_CHAIN_ID, BASE_CHAIN_ID } from '../lib/config'
import { PayrollsPage } from './PayrollsPage'

// Token addresses
const ARC_USDC_ADDRESS =
  '0x3600000000000000000000000000000000000000' as `0x${string}`
const BASE_USDC_ADDRESS =
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`

// Sidebar / tool types
type ToolTab = 'payrolls' | 'gateway' | 'piggy' | 'staking' | 'escrow'

// Labels
const TOOL_LABELS: Record<ToolTab, string> = {
  payrolls: 'Payrolls',
  gateway: 'Gateway bridge',
  piggy: 'Piggyvest savings',
  staking: 'Staking',
  escrow: 'Escrow',
}

// Order for mobile nav if needed later
const TOOL_ORDER: ToolTab[] = [
  'payrolls',
  'gateway',
  'piggy',
  'staking',
  'escrow',
]

export function DashboardPage() {
  const [activeTool, setActiveTool] = useState<ToolTab>('payrolls')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleToolChange = (tool: ToolTab) => {
    setActiveTool(tool)
    setMobileNavOpen(false)
  }

  const {
    employers,
    activeEmployerId,
    setActiveEmployerId,
    boundEmployer,
    needsOnboarding,
    onboardEmployer,
    creatingEmployer,
  } = useWalletEmployerBinding()

  const { address } = useAccount()
  const isConnected = !!address

  // Same connect behavior as Navbar (connectors[0])
  const { connectors, connect, status: connectStatus } = useConnect()
  const mainConnector = connectors[0]

  // -------------------------------------
  // Wallet balances
  // -------------------------------------
  const arcUsdcBalance = useBalance({
    address,
    chainId: ARC_CHAIN_ID,
    token: ARC_USDC_ADDRESS,
    query: {
      enabled: !!address,
      staleTime: 5_000,
      refetchOnWindowFocus: true,
    },
  })

  const baseUsdcBalance = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    token: BASE_USDC_ADDRESS,
    query: {
      enabled: !!address,
      staleTime: 5_000,
      refetchOnWindowFocus: true,
    },
  })

  // Background polling to keep wallet balances fresh (no manual refresh)
  useEffect(() => {
    if (!address) return

    const REFRESH_MS = 10_000

    const interval = window.setInterval(() => {
      arcUsdcBalance.refetch()
      baseUsdcBalance.refetch()
    }, REFRESH_MS)

    return () => {
      window.clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const arcUsdcLabel =
    !address
      ? 'Connect wallet'
      : arcUsdcBalance.data
      ? `${Number(arcUsdcBalance.data.formatted).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })} ${arcUsdcBalance.data.symbol}`
      : '0 USDC'

  const baseUsdcLabel =
    !address
      ? 'Connect wallet'
      : baseUsdcBalance.data
      ? `${Number(baseUsdcBalance.data.formatted).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })} ${baseUsdcBalance.data.symbol}`
      : '0 USDC'

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] bg-[#02071c] text-slate-50 text-[15px] md:text-[14px]">
      {/* -------------------------------------
          SIDEBAR (DESKTOP & LARGE)
         ------------------------------------- */}
      <aside className="hidden w-[320px] xl:w-[336px] flex-col border-r border-slate-900/80 bg-[#02071c] px-6 py-10 lg:flex">
        <div className="mb-6 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Core tools
        </div>

        <div className="space-y-4">
          {/* Payrolls */}
          <button
            type="button"
            onClick={() => handleToolChange('payrolls')}
            className={[
              'group flex w-full items-center gap-5 rounded-2xl px-4 py-4 text-left text-[15px] transition-colors border',
              activeTool === 'payrolls'
                ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50 noise-surface'
                : 'bg-[#02071c] border-transparent text-slate-400 hover:bg-slate-900/60 hover:border-slate-700/80 hover:text-slate-100',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors',
                activeTool === 'payrolls'
                  ? 'border-[#95a7f5]/80 bg-transparent'
                  : 'border-slate-800/80 bg-transparent group-hover:border-[#95a7f5]/60',
              ].join(' ')}
            >
              <Briefcase className="h-7 w-7 text-[#95a7f5]" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Payrolls</span>
              <span className="block text-xs text-slate-500">
                Streams, funding, dispatch
              </span>
            </div>
          </button>

          {/* Gateway */}
          <button
            type="button"
            onClick={() => handleToolChange('gateway')}
            className={[
              'group flex w-full items-center gap-5 rounded-2xl px-4 py-4 text-left text-[15px] transition-colors border',
              activeTool === 'gateway'
                ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50 noise-surface'
                : 'bg-[#02071c] border-transparent text-slate-400 hover:bg-slate-900/60 hover:border-slate-700/80 hover:text-slate-100',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors',
                activeTool === 'gateway'
                  ? 'border-[#95a7f5]/80 bg-transparent'
                  : 'border-slate-800/80 bg-transparent group-hover:border-[#95a7f5]/60',
              ].join(' ')}
            >
              <ArrowLeftRight className="h-7 w-7 text-[#95a7f5]" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Gateway bridge</span>
              <span className="block text-xs text-slate-500">
                Cross-chain USDC treasury
              </span>
            </div>
          </button>

          {/* Piggy */}
          <button
            type="button"
            onClick={() => handleToolChange('piggy')}
            className={[
              'group flex w-full items-center gap-5 rounded-2xl px-4 py-4 text-left text-[15px] transition-colors border',
              activeTool === 'piggy'
                ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50 noise-surface'
                : 'bg-[#02071c] border-transparent text-slate-400 hover:bg-slate-900/60 hover:border-slate-700/80 hover:text-slate-100',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors',
                activeTool === 'piggy'
                  ? 'border-[#95a7f5]/80 bg-transparent'
                  : 'border-slate-800/80 bg-transparent group-hover:border-[#95a7f5]/60',
              ].join(' ')}
            >
              <PiggyBank className="h-7 w-7 text-[#95a7f5]" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Piggyvest savings</span>
              <span className="block text-xs text-slate-500">
                Flex and fixed vaults
              </span>
            </div>
          </button>

          {/* Staking */}
          <button
            type="button"
            onClick={() => handleToolChange('staking')}
            className={[
              'group flex w-full items-center gap-5 rounded-2xl px-4 py-4 text-left text-[15px] transition-colors border',
              activeTool === 'staking'
                ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50 noise-surface'
                : 'bg-[#02071c] border-transparent text-slate-400 hover:bg-slate-900/60 hover:border-slate-700/80 hover:text-slate-100',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors',
                activeTool === 'staking'
                  ? 'border-[#95a7f5]/80 bg-transparent'
                  : 'border-slate-800/80 bg-transparent group-hover:border-[#95a7f5]/60',
              ].join(' ')}
            >
              <Coins className="h-7 w-7 text-[#95a7f5]" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Staking</span>
              <span className="block text-xs text-slate-500">
                Yield on idle funds
              </span>
            </div>
            <span className="ml-auto rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              Soon
            </span>
          </button>

          {/* Escrow */}
          <button
            type="button"
            onClick={() => handleToolChange('escrow')}
            className={[
              'group flex w-full items-center gap-5 rounded-2xl px-4 py-4 text-left text-[15px] transition-colors border',
              activeTool === 'escrow'
                ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50 noise-surface'
                : 'bg-[#02071c] border-transparent text-slate-400 hover:bg-slate-900/60 hover:border-slate-700/80 hover:text-slate-100',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors',
                activeTool === 'escrow'
                  ? 'border-[#95a7f5]/80 bg-transparent'
                  : 'border-slate-800/80 bg-transparent group-hover:border-[#95a7f5]/60',
              ].join(' ')}
            >
              <ShieldCheck className="h-7 w-7 text-[#95a7f5]" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Escrow</span>
              <span className="block text-xs text-slate-500">
                Milestone payouts
              </span>
            </div>
            <span className="ml-auto rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              Soon
            </span>
          </button>
        </div>

        <div className="mt-auto border-t border-slate-900 pt-6 text-[11px] text-slate-500">
          <div>Env: Arc Testnet · Base Sepolia</div>
          <div className="mt-1">Powered by Circle Gateway</div>
        </div>
      </aside>

      {/* -------------------------------------
          MOBILE SIDEBAR DRAWER
         ------------------------------------- */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          {/* Drawer */}
          <div className="flex h-full w-72 max-w-[80%] flex-col border-r border-slate-900 bg-[#02071c] px-4 py-5 shadow-2xl shadow-black/60">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Core tools
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pb-4">
              <button
                type="button"
                onClick={() => handleToolChange('payrolls')}
                className={[
                  'group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left text-[14px] transition-colors border',
                  activeTool === 'payrolls'
                    ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50'
                    : 'bg-[#02071c] border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:text-slate-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
                    activeTool === 'payrolls'
                      ? 'border-[#95a7f5]/80'
                      : 'border-slate-800/80 group-hover:border-[#95a7f5]/60',
                  ].join(' ')}
                >
                  <Briefcase className="h-6 w-6 text-[#95a7f5]" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Payrolls</span>
                  <span className="text-[11px] text-slate-500">
                    Streams, funding, dispatch
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToolChange('gateway')}
                className={[
                  'group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left text-[14px] transition-colors border',
                  activeTool === 'gateway'
                    ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50'
                    : 'bg-[#02071c] border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:text-slate-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
                    activeTool === 'gateway'
                      ? 'border-[#95a7f5]/80'
                      : 'border-slate-800/80 group-hover:border-[#95a7f5]/60',
                  ].join(' ')}
                >
                  <ArrowLeftRight className="h-6 w-6 text-[#95a7f5]" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Gateway bridge</span>
                  <span className="text-[11px] text-slate-500">
                    Cross-chain USDC treasury
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToolChange('piggy')}
                className={[
                  'group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left text-[14px] transition-colors border',
                  activeTool === 'piggy'
                    ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50'
                    : 'bg-[#02071c] border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:text-slate-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
                    activeTool === 'piggy'
                      ? 'border-[#95a7f5]/80'
                      : 'border-slate-800/80 group-hover:border-[#95a7f5]/60',
                  ].join(' ')}
                >
                  <PiggyBank className="h-6 w-6 text-[#95a7f5]" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Piggyvest savings</span>
                  <span className="text-[11px] text-slate-500">
                    Flex and fixed vaults
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToolChange('staking')}
                className={[
                  'group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left text-[14px] transition-colors border',
                  activeTool === 'staking'
                    ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50'
                    : 'bg-[#02071c] border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:text-slate-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
                    activeTool === 'staking'
                      ? 'border-[#95a7f5]/80'
                      : 'border-slate-800/80 group-hover:border-[#95a7f5]/60',
                  ].join(' ')}
                >
                  <Coins className="h-6 w-6 text-[#95a7f5]" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Staking</span>
                  <span className="text-[11px] text-slate-500">
                    Yield on idle funds
                  </span>
                </div>
                <span className="ml-auto rounded-full bg-slate-900 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-400">
                  Soon
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToolChange('escrow')}
                className={[
                  'group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left text-[14px] transition-colors border',
                  activeTool === 'escrow'
                    ? 'bg-slate-900 border-[#95a7f5]/30 text-slate-50'
                    : 'bg-[#02071c] border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:text-slate-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
                    activeTool === 'escrow'
                      ? 'border-[#95a7f5]/80'
                      : 'border-slate-800/80 group-hover:border-[#95a7f5]/60',
                  ].join(' ')}
                >
                  <ShieldCheck className="h-6 w-6 text-[#95a7f5]" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Escrow</span>
                  <span className="text-[11px] text-slate-500">
                    Milestone payouts
                  </span>
                </div>
                <span className="ml-auto rounded-full bg-slate-900 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-400">
                  Soon
                </span>
              </button>
            </div>

            <div className="border-t border-slate-900 pt-3 text-[10px] text-slate-500">
              <div>Env: Arc Testnet · Base Sepolia</div>
              <div className="mt-1">Powered by Circle Gateway</div>
            </div>
          </div>

          {/* Backdrop */}
          <button
            type="button"
            className="flex-1 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
        </div>
      )}

      {/* -------------------------------------
          MAIN CONTENT
         ------------------------------------- */}
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#02071c] via-[#02071c] to-[#050b26]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Hamburger on mobile */}
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 hover:bg-slate-900 lg:hidden"
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>

                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-50">
                  {TOOL_LABELS[activeTool]}
                </h1>
              </div>

              <div className="w-full min-w-[220px] max-w-xs sm:max-w-sm sm:w-auto">
                {isConnected ? (
                  <EmployerSelector
                    employers={employers}
                    activeEmployerId={activeEmployerId}
                    setActiveEmployerId={setActiveEmployerId}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#050b26] px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Wallet className="h-4 w-4 text-[#95a7f5]" />
                      <span className="font-medium">Wallet not connected</span>
                    </div>
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                      Connect to start
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* -------------------------------------
               CONNECT WALLET GATE
               ------------------------------------- */}
            {!isConnected ? (
              <Card className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#050b26] p-5 sm:p-6">
                <div className="relative z-10">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300">
                    <Wallet className="h-4 w-4 text-[#95a7f5]" />
                    Connect wallet
                  </div>

                  <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-50">
                    You’re not connected yet
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm text-slate-400">
                    Connect your wallet to access payrolls, bridge USDC with
                    Gateway, and start saving. Once connected, you’ll bind your
                    wallet to an employer profile to unlock the tools.
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      className="w-full sm:w-auto"
                      loading={connectStatus === 'pending'}
                      onClick={() => {
                        if (mainConnector) connect({ connector: mainConnector })
                      }}
                    >
                      Connect wallet
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <Link to="/" className="w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full sm:w-auto"
                      >
                        Back to home
                      </Button>
                    </Link>

                    <div className="text-xs text-slate-500 sm:ml-auto">
                      Tip: if you don’t see the connect button, open the menu on
                      mobile.
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#4189e1]/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-[#0e305a]/35 blur-3xl" />
              </Card>
            ) : needsOnboarding ? (
              <Card className="space-y-4 border-slate-800 bg-[#050b26]">
                <h2 className="text-base sm:text-lg font-semibold text-slate-50">
                  Get started with Arcflow
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Bind your wallet to an employer profile to use payrolls,
                  gateway bridge and savings.
                </p>
                <EmployerOnboarding
                  onSubmit={onboardEmployer}
                  walletAddress={address}
                  loading={creatingEmployer}
                />
              </Card>
            ) : (
              <>
                {/* -------------------------
                    PAYROLLS
                   ------------------------- */}
                {activeTool === 'payrolls' && (
                  <section className="space-y-4 sm:space-y-5">
                    {/* Hero */}
                    <Card className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#164c90] to-[#0c2b51] px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-[#4189e1]/35">
                      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-xl">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-[#e3eefa]/85">
                            <span className="rounded-full bg-slate-950/40 px-2 py-0.5 uppercase tracking-wide">
                              Payrolls
                            </span>
                            <span className="rounded-full bg-slate-950/30 px-2 py-0.5">
                              Streams &amp; dispatch
                            </span>
                          </div>

                          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#e3eefa]">
                            Automate USDC / EURC payrolls on Arc
                          </h2>
                          <p className="mt-1 text-xs sm:text-sm text-[#e3eefa]/80">
                            Create drafts, fund once, and dispatch on-chain
                            payrolls across Arc with instant or scheduled runs.
                          </p>
                        </div>

                        <div className="mt-2 flex flex-col items-start gap-1 text-left sm:mt-0 sm:items-end sm:text-right">
                          <span className="text-[10px] sm:text-[11px] uppercase tracking-wide text-[#e3eefa]/80">
                            Employer context
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-[#e3eefa]/75">
                            Bound wallet · multi-payee streams
                          </span>
                        </div>
                      </div>

                      <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[#4189e1]/35 blur-3xl" />
                      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#0e305a]/45 blur-3xl" />
                    </Card>

                    <div className="rounded-2xl border border-slate-800 bg-[#050b26] p-4 sm:p-5">
                      <PayrollsPage />
                    </div>
                  </section>
                )}

                {/* -------------------------
                    GATEWAY BRIDGE
                   ------------------------- */}
                {activeTool === 'gateway' && (
                  <section className="space-y-5 sm:space-y-6">
                    {/* Hero */}
                    <Card className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-[#164c90] to-[#0c2b51] px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-[#4189e1]/35">
                      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-xl">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-[#e3eefa]/85">
                            <span className="rounded-full bg-slate-950/40 px-2 py-0.5 uppercase tracking-wide">
                              Gateway bridge
                            </span>
                            <span className="rounded-full bg-slate-950/30 px-2 py-0.5">
                              Arc ↔ Base
                            </span>
                            <span className="rounded-full bg-slate-950/30 px-2 py-0.5">
                              Base ↔ Arc
                            </span>
                          </div>

                          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#e3eefa]">
                            Move USDC seamlessly across chains
                          </h2>
                          <p className="mt-1 text-xs sm:text-sm text-[#e3eefa]/80">
                            Bridge USDC between Arc Testnet and Base Sepolia via
                            Circle Gateway. Fund payrolls from the right chain
                            at the right time.
                          </p>
                        </div>

                        <div className="mt-2 flex flex-col items-start gap-1 text-left sm:mt-0 sm:items-end sm:text-right">
                          <span className="text-[10px] sm:text-[11px] uppercase tracking-wide text-[#e3eefa]/80">
                            Environment
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-[#e3eefa]/75">
                            Arc · Base Sepolia
                          </span>
                        </div>
                      </div>

                      <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[#4189e1]/35 blur-3xl" />
                      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#0e305a]/45 blur-3xl" />
                    </Card>

                    {/* Treasury + Wallet Balances */}
                    <div className="grid gap-5 lg:grid-cols-[1.3fr_1.1fr]">
                      <GatewayBalancesPanel employer={boundEmployer} />

                      <WalletBalancesPanel
                        arcLabel={arcUsdcLabel}
                        baseLabel={baseUsdcLabel}
                      />
                    </div>

                    {/* Deposit + Bridge */}
                    <div className="grid gap-5 md:grid-cols-2">
                      {/* Deposit */}
                      {boundEmployer && (
                        <Card className="rounded-2xl border border-slate-800 bg-[#050b26] p-4 sm:p-5">
                          <h3 className="mb-2 text-sm font-semibold text-slate-200">
                            Deposit from wallet → Gateway
                          </h3>
                          <GatewayDepositForm />
                        </Card>
                      )}

                      {/* Bridge */}
                      <Card className="rounded-2xl border border-slate-800 bg-[#050b26] p-4 sm:p-5">
                        <h3 className="mb-2 text-sm font-semibold text-slate-200">
                          Bridge USDC between Arc &amp; Base
                        </h3>
                        <GatewayTransferForm employer={boundEmployer} />
                      </Card>
                    </div>
                  </section>
                )}

                {/* -------------------------
                    SAVINGS
                   ------------------------- */}
                {activeTool === 'piggy' && (
                  <section className="space-y-4 sm:space-y-5">
                    <SavingsPanel />
                  </section>
                )}

                {/* -------------------------
                    STAKING (COMING SOON)
                   ------------------------- */}
                {activeTool === 'staking' && (
                  <section className="space-y-4 sm:space-y-5">
                    <Card className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-700 via-slate-900 to-slate-950 px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-[#4189e1]/20">
                      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-xl">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-slate-100/90">
                            <span className="rounded-full bg-slate-950/50 px-2 py-0.5 uppercase tracking-wide">
                              Staking
                            </span>
                            <span className="rounded-full bg-slate-950/40 px-2 py-0.5">
                              Coming soon
                            </span>
                          </div>

                          <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                            Put idle USDC to work
                          </h2>
                          <p className="mt-1 text-xs sm:text-sm text-slate-100/80">
                            Delegate part of your treasury into staking
                            strategies and validator rewards while keeping clear
                            visibility from the same dashboard.
                          </p>
                        </div>

                        <span className="mt-2 rounded-full bg-slate-950/70 px-3 py-1 text-[10px] sm:text-xs uppercase tracking-wide text-slate-200">
                          In development
                        </span>
                      </div>

                      <div className="pointer-events-none absolute -right-20 -top-16 h-40 w-40 rounded-full bg-[#4189e1]/22 blur-3xl" />
                      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-slate-200/10 blur-3xl" />
                    </Card>
                  </section>
                )}

                {/* -------------------------
                    ESCROW (COMING SOON)
                   ------------------------- */}
                {activeTool === 'escrow' && (
                  <section className="space-y-4 sm:space-y-5">
                    <Card className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-700 via-slate-900 to-slate-950 px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-[#4189e1]/20">
                      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-xl">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-slate-100/90">
                            <span className="rounded-full bg-slate-950/50 px-2 py-0.5 uppercase tracking-wide">
                              Escrow
                            </span>
                            <span className="rounded-full bg-slate-950/40 px-2 py-0.5">
                              Coming soon
                            </span>
                          </div>

                          <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                            Milestone-based USDC payouts
                          </h2>
                          <p className="mt-1 text-xs sm:text-sm text-slate-100/80">
                            Lock funds for grants, vendor deals or bounties and
                            release on deliverables instead of paying everything
                            upfront.
                          </p>
                        </div>

                        <span className="mt-2 rounded-full bg-slate-950/70 px-3 py-1 text-[10px] sm:text-xs uppercase tracking-wide text-slate-200">
                          In development
                        </span>
                      </div>

                      <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-[#4189e1]/20 blur-3xl" />
                      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-slate-200/12 blur-3xl" />
                    </Card>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
