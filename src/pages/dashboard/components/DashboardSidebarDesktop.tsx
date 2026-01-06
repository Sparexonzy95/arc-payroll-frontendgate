import arcflowLogo from '../../../assets/arcflow-logo.png'
import {
  IconArrowsExchange,
  IconBriefcase,
  IconCoins,
  IconPigMoney,
  IconShieldCheck,
  IconBuildingStore,
  IconShieldLock,
  IconMail,
} from '@tabler/icons-react'
import type { ToolTab } from '../dashboard.constants'

type Props = {
  activeTool: ToolTab
  onToolChange: (tool: ToolTab) => void
}

const UI = {
  /* surfaces */
  sidebarBg: '#EEF2F7', // stays light
  border: 'rgba(15,23,42,0.08)',

  /* text */
  text: '#0F172A',
  muted: '#64748B',
  faint: '#94A3B8',

  /* cards */
  itemBg: 'rgba(255,255,255,0.72)',
  itemHoverBg: 'rgba(255,255,255,0.92)',

  /* ACTIVE (aligned with base color) */
  activeBg: '#0c2b51',          // ✅ BASE COLOR
  activeText: '#FFFFFF',

  /* icons */
  iconBlue: '#0d305a',          // one step lighter than base
}

const ICON = { size: 20, stroke: 1.6 }
const INSET_X = 16
const insetStyle = { paddingLeft: INSET_X, paddingRight: INSET_X } as const

function cx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(' ')
}

function itemClass() {
  return cx(
    'w-full',
    'h-[88px]',
    'px-5',
    'rounded-[18px]',
    'flex items-center gap-4',
    'text-left',
    'transition-[background,color,transform,box-shadow,border] duration-150 ease-out',
    'hover:-translate-y-[1px]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-[#EEF2F7]'
  )
}

function iconBoxClass(active: boolean) {
  return cx(
    'h-12 w-12 rounded-[16px] flex items-center justify-center border',
    active
      ? 'bg-white/10 border-white/15'
      : 'bg-white/70 border-[rgba(15,23,42,0.08)]'
  )
}


function itemStyle(active: boolean) {
  return {
    background: active ? UI.activeBg : UI.itemBg,
    boxShadow: active
      ? '0 10px 26px rgba(12,43,81,0.35)'   // base-color shadow
      : '0 8px 18px rgba(15,23,42,0.06)',
    border: active
      ? '1px solid rgba(255,255,255,0.10)'
      : `1px solid ${UI.border}`,
    color: active ? UI.activeText : UI.text,
  } as const
}


function subtitleColor(active: boolean) {
  return active ? 'rgba(255,255,255,0.72)' : UI.muted
}

function iconColor(active: boolean) {
  return active ? '#FFFFFF' : UI.iconBlue
}

function soonPill(active: boolean) {
  return {
    background: active
      ? 'rgba(255,255,255,0.14)'
      : 'rgba(15,23,42,0.06)',
    color: active
      ? 'rgba(255,255,255,0.85)'
      : UI.muted,
    border: active
      ? '1px solid rgba(255,255,255,0.18)'
      : '1px solid rgba(15,23,42,0.08)',
  } as const
}


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-[0.22em] leading-none m-0 p-0"
      style={{ color: UI.faint }}
    >
      {children}
    </div>
  )
}

export function DashboardSidebarDesktop({ activeTool, onToolChange }: Props) {
  return (
    <aside
      className="hidden lg:flex flex-col"
      style={{
        width: 268,
        minHeight: '100vh',
        background: UI.sidebarBg,
        borderRight: `1px solid ${UI.border}`,
        paddingTop: 0,
      }}
    >
      {/* TOP — fully tightened */}
      <div style={insetStyle} className="m-0 p-0 pt-0">
        <img
          src={arcflowLogo}
          alt="Arcflow"
          draggable={false}
          className="h-8 w-auto block m-0 p-0 mt-0 pt-2"
        />

        {/* Core label */}
        <div className="m-0 p-2 mt-0 pt-0">
          <SectionLabel>Core Tools</SectionLabel>
        </div>
      </div>

      {/* CORE NAV */}
      <nav style={insetStyle} className="space-y-3 mt-0 pt-2">
        {/* Payrolls */}
        <button
          type="button"
          onClick={() => onToolChange('payrolls')}
          className={itemClass()}
          style={itemStyle(activeTool === 'payrolls')}
          onMouseEnter={(e) => {
            if (activeTool !== 'payrolls') e.currentTarget.style.background = UI.itemHoverBg
          }}
          onMouseLeave={(e) => {
            if (activeTool !== 'payrolls') e.currentTarget.style.background = UI.itemBg
          }}
        >
          <span className={iconBoxClass(activeTool === 'payrolls')}>
            <IconBriefcase {...ICON} color={iconColor(activeTool === 'payrolls')} />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold">Payrolls</span>
            <span className="text-[12.5px]" style={{ color: subtitleColor(activeTool === 'payrolls') }}>
              Streams, funding, dispatch
            </span>
          </span>
        </button>

        {/* Gateway */}
        <button
          type="button"
          onClick={() => onToolChange('gateway')}
          className={itemClass()}
          style={itemStyle(activeTool === 'gateway')}
          onMouseEnter={(e) => {
            if (activeTool !== 'gateway') e.currentTarget.style.background = UI.itemHoverBg
          }}
          onMouseLeave={(e) => {
            if (activeTool !== 'gateway') e.currentTarget.style.background = UI.itemBg
          }}
        >
          <span className={iconBoxClass(activeTool === 'gateway')}>
            <IconArrowsExchange {...ICON} color={iconColor(activeTool === 'gateway')} />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold">Gateway Bridge</span>
            <span className="text-[12.5px]" style={{ color: subtitleColor(activeTool === 'gateway') }}>
              Cross-chain USDC treasury
            </span>
          </span>
        </button>

        {/* Piggyvest (no Soon tag) */}
        <button
          type="button"
          onClick={() => onToolChange('piggy')}
          className={itemClass()}
          style={itemStyle(activeTool === 'piggy')}
          onMouseEnter={(e) => {
            if (activeTool !== 'piggy') e.currentTarget.style.background = UI.itemHoverBg
          }}
          onMouseLeave={(e) => {
            if (activeTool !== 'piggy') e.currentTarget.style.background = UI.itemBg
          }}
        >
          <span className={iconBoxClass(activeTool === 'piggy')}>
            <IconPigMoney {...ICON} color={iconColor(activeTool === 'piggy')} />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold">Piggyvest</span>
            <span className="text-[12.5px]" style={{ color: subtitleColor(activeTool === 'piggy') }}>
              Flex and fixed vaults
            </span>
          </span>
        </button>

        {/* Escrow (moved before staking, no Soon tag) */}
        <button
          type="button"
          onClick={() => onToolChange('escrow')}
          className={itemClass()}
          style={itemStyle(activeTool === 'escrow')}
          onMouseEnter={(e) => {
            if (activeTool !== 'escrow') e.currentTarget.style.background = UI.itemHoverBg
          }}
          onMouseLeave={(e) => {
            if (activeTool !== 'escrow') e.currentTarget.style.background = UI.itemBg
          }}
        >
          <span className={iconBoxClass(activeTool === 'escrow')}>
            <IconShieldCheck {...ICON} color={iconColor(activeTool === 'escrow')} />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold">Escrow</span>
            <span className="text-[12.5px]" style={{ color: subtitleColor(activeTool === 'escrow') }}>
              Milestone payouts
            </span>
          </span>
        </button>

        {/* Staking (ONLY one with Soon) */}
        <button
          type="button"
          onClick={() => onToolChange('staking')}
          className={itemClass()}
          style={itemStyle(activeTool === 'staking')}
          onMouseEnter={(e) => {
            if (activeTool !== 'staking') e.currentTarget.style.background = UI.itemHoverBg
          }}
          onMouseLeave={(e) => {
            if (activeTool !== 'staking') e.currentTarget.style.background = UI.itemBg
          }}
        >
          <span className={iconBoxClass(activeTool === 'staking')}>
            <IconCoins {...ICON} color={iconColor(activeTool === 'staking')} />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold">Staking</span>
            <span className="text-[12.5px]" style={{ color: subtitleColor(activeTool === 'staking') }}>
              Yield on idle funds
            </span>
          </span>

          <span
            className="ml-auto h-[28px] px-3 rounded-full flex items-center text-[10.5px] uppercase tracking-wide"
            style={soonPill(activeTool === 'staking')}
          >
            Soon
          </span>
        </button>
      </nav>

      {/* COMPANY */}
      <div style={insetStyle} className="pt-5 pb-2">
        <SectionLabel>Company</SectionLabel>
      </div>

      <nav style={insetStyle} className="space-y-2">
        <button
          type="button"
          className={cx(
            'w-full h-[48px] px-4 rounded-[14px]',
            'flex items-center gap-3',
            'text-left',
            'border',
            'transition-[background,transform] duration-150 ease-out hover:-translate-y-[1px]'
          )}
          style={{
            background: 'rgba(255,255,255,0.55)',
            borderColor: UI.border,
            color: UI.text,
          }}
        >
          <span className="h-9 w-9 rounded-[12px] bg-white border border-[rgba(15,23,42,0.08)] flex items-center justify-center">
            <IconBuildingStore size={18} stroke={1.6} color={UI.iconBlue} />
          </span>
          <span className="text-[14px] font-medium">About</span>
        </button>

        <button
          type="button"
          className={cx(
            'w-full h-[48px] px-4 rounded-[14px]',
            'flex items-center gap-3',
            'text-left',
            'border',
            'transition-[background,transform] duration-150 ease-out hover:-translate-y-[1px]'
          )}
          style={{
            background: 'rgba(255,255,255,0.55)',
            borderColor: UI.border,
            color: UI.text,
          }}
        >
          <span className="h-9 w-9 rounded-[12px] bg-white border border-[rgba(15,23,42,0.08)] flex items-center justify-center">
            <IconShieldLock size={18} stroke={1.6} color={UI.iconBlue} />
          </span>
          <span className="text-[14px] font-medium">Security</span>
        </button>

        <button
          type="button"
          className={cx(
            'w-full h-[48px] px-4 rounded-[14px]',
            'flex items-center gap-3',
            'text-left',
            'border',
            'transition-[background,transform] duration-150 ease-out hover:-translate-y-[1px]'
          )}
          style={{
            background: 'rgba(255,255,255,0.55)',
            borderColor: UI.border,
            color: UI.text,
          }}
        >
          <span className="h-9 w-9 rounded-[12px] bg-white border border-[rgba(15,23,42,0.08)] flex items-center justify-center">
            <IconMail size={18} stroke={1.6} color={UI.iconBlue} />
          </span>
          <span className="text-[14px] font-medium">Contact</span>
        </button>
      </nav>

      {/* Bottom powered pill */}
      <div className="mt-auto" style={{ ...insetStyle, paddingTop: 18, paddingBottom: 18 }}>
        <div
          className="w-full rounded-[18px] border px-4 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.55)',
            borderColor: UI.border,
          }}
        >
          <span className="text-[12px]" style={{ color: UI.muted }}>
            Powered by
          </span>

          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{
              background: '#0E2A55',
              color: 'white',
              boxShadow: '0 10px 22px rgba(2,6,23,0.12)',
            }}
          >
            <img src={arcflowLogo} alt="Arcflow" className="h-4 w-auto" draggable={false} />
            <span className="text-[12px] font-semibold">Arcflow</span>
          </span>
        </div>
      </div>
    </aside>
  )
}
