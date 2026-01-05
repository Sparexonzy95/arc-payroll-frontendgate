// src/pages/dashboard/components/DashboardMobileDrawer.tsx
import {
  IconArrowsExchange,
  IconBriefcase,
  IconCoins,
  IconPigMoney,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react'
import type { ToolTab } from '../dashboard.constants'
import { TOOL_LABELS, TOOL_ORDER } from '../dashboard.constants'

type Props = {
  open: boolean
  activeTool: ToolTab
  onClose: () => void
  onToolChange: (tool: ToolTab) => void
}

const SIDEBAR = {
  bg: '#F3F5F9',
  border: 'rgba(15,23,42,0.06)',
  textSecondary: '#475569',
  textPrimary: '#0F172A',
  textMuted: '#94A3B8',
  primary: '#0B3A8A',
  primaryMuted: 'rgba(11,58,138,0.08)',
}

function navBtnClass(active: boolean) {
  return [
    'group w-full',
    'h-[44px] px-4 rounded-[10px]',
    'flex items-center gap-3',
    'text-left',
    'transition-[color,background,transform] duration-[150ms] ease-out',
    'hover:-translate-y-[1px]',
    active ? 'font-semibold' : 'font-medium',
  ].join(' ')
}

// Drawer/Sidebar icon rule: 20px, stroke 1.5
const ICON = { size: 20, stroke: 1.5 }

export function DashboardMobileDrawer({ open, activeTool, onClose, onToolChange }: Props) {
  if (!open) return null

  // ✅ Escrow before staking, without touching desktop/sidebar constants
  const ORDER: ToolTab[] = (() => {
    const base = (TOOL_ORDER as ToolTab[]).filter((t) =>
      t === 'payrolls' || t === 'gateway' || t === 'piggy' || t === 'escrow' || t === 'staking'
    )

    // Ensure order exactly: payrolls, gateway, piggy, escrow, staking
    const out: ToolTab[] = []
    ;(['payrolls', 'gateway', 'piggy', 'escrow', 'staking'] as ToolTab[]).forEach((t) => {
      if (base.includes(t)) out.push(t)
    })
    return out
  })()

  return (
    <div className="fixed inset-0 z-[80] flex lg:hidden" role="dialog" aria-modal="true">
      {/* Panel */}
      <div
        className="h-full flex flex-col"
        style={{
          width: 248,
          background: SIDEBAR.bg,
          borderRight: `1px solid ${SIDEBAR.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <div
            className="text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: SIDEBAR.textMuted }}
          >
            Core tools
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition-[background,transform] duration-[150ms] ease-out hover:-translate-y-[1px]"
            style={{
              background: 'rgba(15,23,42,0.04)',
              border: `1px solid rgba(15,23,42,0.08)`,
              color: SIDEBAR.textSecondary,
            }}
          >
            <IconX size={18} stroke={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
          {ORDER.map((tool) => {
            const active = activeTool === tool

            return (
              <button
                key={tool}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToolChange(tool)
                }}
                className={navBtnClass(active)}
                style={{
                  background: active ? SIDEBAR.primaryMuted : 'transparent',
                  color: active ? SIDEBAR.primary : SIDEBAR.textSecondary,
                }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-[10px] border"
                  style={{
                    borderColor: 'rgba(15,23,42,0.08)',
                    background: '#FFF',
                  }}
                >
                  {tool === 'payrolls' && (
                    <IconBriefcase {...ICON} color={active ? SIDEBAR.primary : SIDEBAR.textSecondary} />
                  )}
                  {tool === 'gateway' && (
                    <IconArrowsExchange {...ICON} color={active ? SIDEBAR.primary : SIDEBAR.textSecondary} />
                  )}
                  {tool === 'piggy' && (
                    <IconPigMoney {...ICON} color={active ? SIDEBAR.primary : SIDEBAR.textSecondary} />
                  )}
                  {tool === 'escrow' && (
                    <IconShieldCheck {...ICON} color={active ? SIDEBAR.primary : SIDEBAR.textSecondary} />
                  )}
                  {tool === 'staking' && (
                    <IconCoins {...ICON} color={active ? SIDEBAR.primary : SIDEBAR.textSecondary} />
                  )}
                </span>

                <span className="flex flex-col leading-tight">
                  <span
                    className="text-[14px]"
                    style={{
                      color: active ? SIDEBAR.primary : SIDEBAR.textPrimary,
                    }}
                  >
                    {TOOL_LABELS[tool]}
                  </span>
                  <span className="text-[12px]" style={{ color: SIDEBAR.textMuted }}>
                    {tool === 'payrolls' && 'Streams, funding, dispatch'}
                    {tool === 'gateway' && 'Cross-chain USDC treasury'}
                    {tool === 'piggy' && 'Flex and fixed vaults'}
                    {tool === 'escrow' && 'Milestone payouts'}
                    {tool === 'staking' && 'Yield on idle funds'}
                  </span>
                </span>

                {/* ✅ Only staking has Soon now */}
                {tool === 'staking' && (
                  <span
                    className="ml-auto h-[22px] px-2 rounded-full flex items-center text-[10px] uppercase tracking-wide"
                    style={{
                      background: 'rgba(15,23,42,0.05)',
                      color: SIDEBAR.textSecondary,
                    }}
                  >
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div
          className="px-4 py-4 text-[12px]"
          style={{
            borderTop: `1px solid ${SIDEBAR.border}`,
            color: SIDEBAR.textMuted,
          }}
        >
          <div>Env: Arc Testnet · Base Sepolia</div>
          <div className="mt-1">Powered by Circle Gateway</div>
        </div>
      </div>

      {/* Overlay */}
      <button
        type="button"
        className="flex-1 bg-black/40"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close menu"
      />
    </div>
  )
}
