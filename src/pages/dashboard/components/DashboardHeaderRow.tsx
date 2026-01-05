import { IconMenu2, IconWallet } from '@tabler/icons-react'
import type { ToolTab } from '../dashboard.constants'
import { TOOL_LABELS } from '../dashboard.constants'
import { EmployerSelector } from '../../../features/employer/EmployerSelector'
import type { Employer } from '../../../hooks/useWalletEmployerBinding'

type Props = {
  activeTool: ToolTab
  isConnected: boolean
  onOpenMobileNav: () => void
  employers: Employer[]
  activeEmployerId: string | null
  setActiveEmployerId: (id: string) => void
}

const TOKENS = {
  navbarBg: '#0E2A55',
  textOnNavbar: '#FFFFFF',
  textMutedOnNavbar: 'rgba(255,255,255,0.72)',
  chipBg: 'rgba(255,255,255,0.10)',
  chipBorder: 'rgba(255,255,255,0.18)',
  primary: '#0B3A8A',
}

export function DashboardHeaderRow({
  activeTool,
  isConnected,
  onOpenMobileNav,
  employers,
  activeEmployerId,
  setActiveEmployerId,
}: Props) {
  return (
    <header
      className="w-full flex items-center justify-between gap-3"
      style={{
        height: 64,
        paddingLeft: 24,
        paddingRight: 24,
        background: TOKENS.navbarBg,
        borderRadius: 10,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{
            background: TOKENS.chipBg,
            border: `1px solid ${TOKENS.chipBorder}`,
            color: TOKENS.textOnNavbar,
          }}
        >
          <IconMenu2 size={18} stroke={1.75} />
        </button>

        <h1
          className="truncate"
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: TOKENS.textOnNavbar,
          }}
        >
          {TOOL_LABELS[activeTool]}
        </h1>

        <span
          className="hidden sm:inline-flex h-[28px] items-center gap-2 px-3 rounded-full"
          style={{
            background: TOKENS.chipBg,
            border: `1px solid ${TOKENS.chipBorder}`,
            color: TOKENS.textMutedOnNavbar,
            fontSize: 12,
          }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: 'rgba(22,163,74,0.9)' }}
          />
          Arc Testnet · Healthy
        </span>
      </div>

      <div className="min-w-[220px] max-w-xs sm:max-w-sm w-auto">
        {isConnected ? (
          <EmployerSelector
            employers={employers}
            activeEmployerId={activeEmployerId}
            setActiveEmployerId={setActiveEmployerId}
          />
        ) : (
          <div
            className="flex items-center justify-between gap-3 px-3"
            style={{
              height: 40,
              borderRadius: 10,
              background: TOKENS.chipBg,
              border: `1px solid ${TOKENS.chipBorder}`,
            }}
          >
            <div
              className="flex items-center gap-2"
              style={{ color: TOKENS.textOnNavbar, fontSize: 14 }}
            >
              <IconWallet size={16} stroke={1.75} />
              <span style={{ fontWeight: 500 }}>Wallet not connected</span>
            </div>

            <span
              className="h-[28px] px-3 rounded-full flex items-center"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: TOKENS.textMutedOnNavbar,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Connect to start
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
