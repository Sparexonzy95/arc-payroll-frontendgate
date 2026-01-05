// src/components/Navbar.tsx
import { Link } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { IconCircleFilled, IconWallet } from '@tabler/icons-react'
import { Button } from './ui/Button'
import { ArcflowLogo } from './branding/ArcflowLogo'
import { ARC_CHAIN_ID, BASE_CHAIN_ID } from '../lib/config'

const TOKENS = {
  navTop: '#0B2A55',
  navBottom: '#071A3A',
  navBorder: 'rgba(255,255,255,0.12)',

  capsuleBg: 'rgba(255,255,255,0.08)',
  capsuleBorder: 'rgba(255,255,255,0.16)',

  segLeftBg: 'rgba(255,255,255,0.07)',
  segRightBg: 'rgba(255,255,255,0.12)',

  text: 'rgba(255,255,255,0.92)',
  textMuted: 'rgba(255,255,255,0.74)',

  disconBg: 'rgba(255,255,255,0.92)',
  disconBorder: 'rgba(255,255,255,0.72)',
  disconText: 'rgba(11,42,85,0.95)',
}

function chainLabel(id?: number) {
  if (!id) return 'Arc Testnet'
  if (id === ARC_CHAIN_ID) return 'Arc Testnet'
  if (id === BASE_CHAIN_ID) return 'Base Sepolia'
  return `Chain ${id}`
}

function shortAddress(addr?: string) {
  if (!addr) return '0x----'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, status: connectStatus } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()

  const mainConnector = connectors[0]

  const network = chainLabel(chainId)
  const health = 'Healthy'
  const walletLabel = shortAddress(address)

  const SLANT = 18 // px

  return (
    <nav
      className="sticky top-0 z-30 w-full overflow-x-hidden"
      style={{
        background: `radial-gradient(900px 320px at 20% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 60%), linear-gradient(180deg, ${TOKENS.navTop} 0%, ${TOKENS.navBottom} 100%)`,
        borderBottom: `1px solid ${TOKENS.navBorder}`,
      }}
    >
      {/* ✅ Mobile-safe row padding + prevent children forcing overflow */}
      <div className="flex h-[84px] sm:h-[88px] w-full items-center px-3 sm:px-6 min-w-0 overflow-hidden">
        {/* Logo (tight hitbox, no stretching) */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            aria-label="Go to landing page"
            className="inline-flex items-center shrink-0"
            style={{ width: 'fit-content', maxWidth: 'fit-content' }}
          >
            <span className="inline-flex items-center shrink-0">
              <ArcflowLogo compact className="h-9 sm:h-11 w-auto" />
            </span>
          </Link>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center min-w-0">
          {/* Outer capsule */}
          <div
            className="relative overflow-hidden"
            style={{
              height: 40,
              borderRadius: 999,
              border: `1px solid ${TOKENS.capsuleBorder}`,
              background: TOKENS.capsuleBg,
              boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'stretch',
              minWidth: 0,
              // ✅ keep capsule inside viewport on tiny phones
              maxWidth: 'min(92vw, 520px)',
            }}
          >
            {/* LEFT segment (hidden on mobile) */}
            <div
              className="hidden sm:flex items-center gap-2 pl-4 pr-8"
              style={{
                background: TOKENS.segLeftBg,
                clipPath: `polygon(0% 0%, calc(100% - ${SLANT}px) 0%, 100% 50%, calc(100% - ${SLANT}px) 100%, 0% 100%)`,
              }}
            >
              <span style={{ color: TOKENS.text, fontSize: 13, fontWeight: 600 }}>{network}</span>
              <span style={{ color: TOKENS.textMuted, opacity: 0.9 }}>•</span>
              <span className="inline-flex items-center gap-2" style={{ color: TOKENS.textMuted, fontSize: 13 }}>
                <IconCircleFilled size={8} className="text-green-400" />
                <span style={{ fontWeight: 600 }}>{health}</span>
              </span>
            </div>

            {/* RIGHT segment */}
            <div
              className="flex items-center gap-2 pr-2 sm:pr-4 min-w-0"
              style={{
                background: TOKENS.segRightBg,
                // ✅ smaller left padding on mobile, larger on desktop
                paddingLeft: 14,
                clipPath: `polygon(${SLANT}px 0%, 100% 0%, 100% 100%, ${SLANT}px 100%, 0% 50%)`,
                marginLeft: -2,
              }}
            >
              {/* Wallet label should never push width on mobile */}
              <span
                className="truncate min-w-0"
                title={address}
                style={{
                  color: TOKENS.text,
                  fontSize: 13,
                  fontWeight: 600,
                  // ✅ clamp hard for mobile, relax on larger screens with CSS
                  maxWidth: 96,
                }}
              >
                {walletLabel}
              </span>

              {isConnected ? (
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="inline-flex items-center justify-center shrink-0"
                  style={{
                    height: 30,
                    paddingLeft: 10,
                    paddingRight: 10,
                    borderRadius: 999,
                    background: TOKENS.disconBg,
                    border: `1px solid ${TOKENS.disconBorder}`,
                    color: TOKENS.disconText,
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Discon
                </button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={connectStatus === 'pending'}
                  onClick={() => mainConnector && connect({ connector: mainConnector })}
                  className="h-[30px] rounded-full px-3 shrink-0"
                >
                  <IconWallet size={16} stroke={1.6} />
                  Connect
                </Button>
              )}
            </div>
          </div>

          {/* ✅ little breathing room from right edge already handled by px-* on row */}
        </div>
      </div>

      {/* ✅ responsive tweak: allow bigger wallet label on >= sm without JS */}
      <style>{`
        @media (min-width: 640px) {
          nav [title] { max-width: 170px !important; }
          nav [style*="padding-left: 14px"] { padding-left: 32px !important; }
        }
      `}</style>
    </nav>
  )
}
