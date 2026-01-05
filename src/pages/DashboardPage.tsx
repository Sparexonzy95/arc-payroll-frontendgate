// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useChainId, useConnect, useSwitchChain } from 'wagmi'
import { useLocation, useNavigate } from 'react-router-dom'
import { IconChevronDown, IconMenu2 } from '@tabler/icons-react'

import { EmployerOnboarding } from '../features/employer/EmployerOnboarding'
import { GatewayBalancesPanel } from '../features/gateway/GatewayBalancesPanel'
import { GatewayDepositForm } from '../features/gateway/GatewayDepositForm'
import { GatewayTransferForm } from '../features/gateway/GatewayTransferForm'
import { SavingsPanel } from '../features/savings/SavingsPanel'
import { WalletBalancesPanel } from '../features/gateway/WalletBalancesPanel'
import { PayrollsPage } from './PayrollsPage'
import { EscrowTool } from '../features/escrow/EscrowTool'

import { useWalletEmployerBinding } from '../hooks/useWalletEmployerBinding'
import { Card } from '../components/ui/Card'
import { ARC_CHAIN_ID, BASE_CHAIN_ID } from '../lib/config'

import type { ToolTab } from './dashboard/dashboard.constants'
import { TOOL_REQUIRED_CHAIN, TOOL_LABELS } from './dashboard/dashboard.constants'
import { DashboardSidebarDesktop } from './dashboard/components/DashboardSidebarDesktop'
import { DashboardMobileDrawer } from './dashboard/components/DashboardMobileDrawer'
import { DashboardConnectGate } from './dashboard/components/DashboardConnectGate'
import { DashboardNetworkGate } from './dashboard/components/DashboardNetworkGate'

import { DashboardBanner } from './dashboard/components/DashboardBanner'

// Token addresses
const ARC_USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as `0x${string}`
const BASE_USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`

const TOKENS = {
  bgBase: '#F7F9FC',
  card: '#FFFFFF',
  border: 'rgba(15,23,42,0.06)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
}

const chainLabel = (id?: number) => {
  if (!id) return 'Unknown network'
  if (id === ARC_CHAIN_ID) return 'Arc Testnet'
  if (id === BASE_CHAIN_ID) return 'Base Sepolia'
  return `Chain ${id}`
}

const CHEV = { size: 18, stroke: 2 }

function isToolTab(x: any): x is ToolTab {
  return x === 'payrolls' || x === 'gateway' || x === 'piggy' || x === 'staking' || x === 'escrow'
}
function readToolFromSearch(search: string): ToolTab | null {
  const p = new URLSearchParams(search)
  const raw = (p.get('tool') || '').trim()
  return isToolTab(raw) ? raw : null
}
function setToolInSearch(search: string, tool: ToolTab): string {
  const p = new URLSearchParams(search)
  p.set('tool', tool)
  const out = p.toString()
  return out ? `?${out}` : ''
}

type BannerSpec = {
  title: string
  badgeText: string
  headline: string
  subline: string
  rightLabel: string
  rightValue: string
}

function bannerSpec(tool: ToolTab, currentNetworkLabel: string, activeEmployerName: string): BannerSpec {
  const rightLabel = 'Employer'
  const rightValue = activeEmployerName

  if (tool === 'payrolls') {
    return {
      title: 'Payrolls',
      badgeText: currentNetworkLabel,
      headline: 'Automated USDC / EURC payrolls on Arc',
      subline: 'Fund once, schedule and dispatch automatically.',
      rightLabel,
      rightValue,
    }
  }

  if (tool === 'gateway') {
    return {
      title: 'Gateway',
      badgeText: 'Arc · Base Sepolia',
      headline: 'Move USDC between Arc and Base',
      subline: 'Deposit, bridge and settle.',
      rightLabel,
      rightValue,
    }
  }

  if (tool === 'piggy') {
    return {
      title: 'Savings',
      badgeText: currentNetworkLabel,
      headline: 'Save USDC with flexible or fixed vaults',
      subline: 'Deposit, lock, withdraw.',
      rightLabel,
      rightValue,
    }
  }

  if (tool === 'escrow') {
    return {
      title: 'Escrow',
      badgeText: currentNetworkLabel,
      headline: 'Secure on-chain payments with dispute protection',
      subline: 'Fund, verify, release.',
      rightLabel,
      rightValue,
    }
  }

  // ✅ Staking: short, muted banner (content area will be empty)
  return {
    title: 'Staking',
    badgeText: currentNetworkLabel,
    headline: 'Staking strategies (in development)',
    subline: 'Coming soon.',
    rightLabel,
    rightValue,
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [activeTool, setActiveTool] = useState<ToolTab>('payrolls')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const fromUrl = readToolFromSearch(location.search)
    if (fromUrl && fromUrl !== activeTool) setActiveTool(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const handleToolChange = (tool: ToolTab) => {
    setActiveTool(tool)
    setMobileNavOpen(false)
    const nextSearch = setToolInSearch(location.search, tool)
    navigate({ pathname: location.pathname, search: nextSearch }, { replace: true })
  }

  const { employers, activeEmployerId, boundEmployer, needsOnboarding, onboardEmployer, creatingEmployer } =
    useWalletEmployerBinding()

  const { address } = useAccount()
  const isConnected = !!address

  const { connectors, connect, status: connectStatus } = useConnect()
  const mainConnector = connectors[0]

  const chainId = useChainId()
  const { switchChain, chains, status: switchStatus, error: switchError } = useSwitchChain()

  const requiredChainId = TOOL_REQUIRED_CHAIN[activeTool]
  const isWrongChain = isConnected && requiredChainId !== null && chainId !== requiredChainId
  const canSwitch = requiredChainId !== null && (chains ?? []).some((c) => c.id === requiredChainId)

  const handleSwitchToRequired = () => {
    if (!requiredChainId || !switchChain) return
    switchChain({ chainId: requiredChainId })
  }

  const arcUsdcBalance = useBalance({
    address,
    chainId: ARC_CHAIN_ID,
    token: ARC_USDC_ADDRESS,
    query: { enabled: !!address, staleTime: 5_000, refetchOnWindowFocus: true },
  })

  const baseUsdcBalance = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    token: BASE_USDC_ADDRESS,
    query: { enabled: !!address, staleTime: 5_000, refetchOnWindowFocus: true },
  })

  useEffect(() => {
    if (!address) return
    const interval = window.setInterval(() => {
      arcUsdcBalance.refetch()
      baseUsdcBalance.refetch()
    }, 10_000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const arcUsdcLabel =
    !address
      ? 'Connect wallet'
      : arcUsdcBalance.data
      ? `${Number(arcUsdcBalance.data.formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${
          arcUsdcBalance.data.symbol
        }`
      : '0 USDC'

  const baseUsdcLabel =
    !address
      ? 'Connect wallet'
      : baseUsdcBalance.data
      ? `${Number(baseUsdcBalance.data.formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${
          baseUsdcBalance.data.symbol
        }`
      : '0 USDC'

  const activeEmployerName = useMemo(() => {
    if (!employers?.length) return '—'
    const found = employers.find((e: any) => String(e.id) === String(activeEmployerId))
    return (found?.name || found?.company_name || found?.label || 'Employer') as string
  }, [employers, activeEmployerId])

  const currentNetworkLabel = useMemo(() => chainLabel(chainId), [chainId])

  const banner = useMemo(
    () => bannerSpec(activeTool, currentNetworkLabel, activeEmployerName),
    [activeTool, currentNetworkLabel, activeEmployerName]
  )

  const isStaking = activeTool === 'staking'

  return (
    <div
      className={['relative flex flex-col overflow-x-hidden', 'min-h-screen', 'min-h-[100dvh]'].join(' ')}
      style={{ background: TOKENS.bgBase, color: TOKENS.textPrimary }}
    >
      <DashboardMobileDrawer
        open={mobileNavOpen}
        activeTool={activeTool}
        onClose={() => setMobileNavOpen(false)}
        onToolChange={handleToolChange}
      />

      <div className="flex flex-1 min-h-0">
        <DashboardSidebarDesktop activeTool={activeTool} onToolChange={handleToolChange} />

        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-[1280px] px-3 pt-1 pb-10 sm:px-4 sm:py-5 lg:px-6 lg:py-6 space-y-4 sm:space-y-5">
              {!mobileNavOpen && (
                <div className="md:hidden relative z-[60]">
                  <div
                    className="flex items-center justify-between rounded-[14px] px-3 py-2"
                    style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
                  >
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setMobileNavOpen(true)
                      }}
                      className="relative z-[70] inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium"
                      style={{
                        background: 'rgba(15,23,42,0.03)',
                        border: `1px solid ${TOKENS.border}`,
                        color: TOKENS.textPrimary,
                      }}
                      aria-label="Open menu"
                    >
                      <IconMenu2 size={18} stroke={2} />
                      Menu
                    </button>

                    <div className="min-w-0 text-right">
                      <div className="text-[12px] font-semibold truncate">{TOOL_LABELS[activeTool]}</div>
                      <div className="text-[11px] truncate" style={{ color: TOKENS.textSecondary }}>
                        {currentNetworkLabel}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isConnected ? (
                <DashboardConnectGate
                  loading={connectStatus === 'pending'}
                  onConnect={() => {
                    if (mainConnector) connect({ connector: mainConnector })
                  }}
                />
              ) : needsOnboarding ? (
                <Card
                  className="space-y-4 p-4 sm:p-5"
                  style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
                >

                  <EmployerOnboarding onSubmit={onboardEmployer} walletAddress={address} loading={creatingEmployer} />
                </Card>
              ) : (
                <>
                  {isWrongChain && (
                    <DashboardNetworkGate
                      toolLabel={TOOL_LABELS[activeTool]}
                      requiredChainLabel={chainLabel(requiredChainId ?? undefined)}
                      currentChainLabel={chainLabel(chainId)}
                      canSwitch={!!canSwitch}
                      loading={switchStatus === 'pending'}
                      onSwitch={handleSwitchToRequired}
                      switchError={switchError}
                    />
                  )}

                  {!isWrongChain && (
                    <DashboardBanner
                      title={banner.title}
                      badgeText={banner.badgeText}
                      headline={banner.headline}
                      subline={banner.subline}
                      rightLabel={banner.rightLabel}
                      rightValue={banner.rightValue}
                      rightIcon={<IconChevronDown {...CHEV} />}
                      muted={isStaking}
                      onRightClick={() => {}}
                    />
                  )}

                  {activeTool === 'payrolls' && !isWrongChain && (
                    <section className="space-y-4">
                      <div
                        className="rounded-[14px] p-3 sm:p-4"
                        style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
                      >
                        <PayrollsPage />
                      </div>
                    </section>
                  )}

                  {activeTool === 'gateway' && !isWrongChain && (
                    <section className="space-y-4 sm:space-y-5">
                      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.3fr_1.1fr]">
                        <GatewayBalancesPanel employer={boundEmployer} />
                        <WalletBalancesPanel arcLabel={arcUsdcLabel} baseLabel={baseUsdcLabel} />
                      </div>

                      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                        {boundEmployer && (
                          <Card className="p-4" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}>
                            <h3 className="mb-2 text-sm font-semibold">Deposit from wallet → Gateway</h3>
                            <GatewayDepositForm />
                          </Card>
                        )}

                        <Card className="p-4" style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}>
                          <h3 className="mb-2 text-sm font-semibold">Bridge USDC between Arc & Base</h3>
                          <GatewayTransferForm employer={boundEmployer} />
                        </Card>
                      </div>
                    </section>
                  )}

                  {activeTool === 'piggy' && !isWrongChain && <SavingsPanel />}
                  {activeTool === 'escrow' && !isWrongChain && <EscrowTool />}

                  {/* ✅ STAKING renders nothing (banner only) */}
                  {activeTool === 'staking' && !isWrongChain && null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
