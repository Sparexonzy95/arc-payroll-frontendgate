// src/components/Navbar.tsx
import { Link, NavLink } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { motion } from 'framer-motion'
import { ArcflowLogo } from './branding/ArcflowLogo'
import { Home } from 'lucide-react'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, status: connectStatus } = useConnect()
  const { disconnect } = useDisconnect()

  const mainConnector = connectors[0]

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : 'Not connected'

  return (
    <nav
      className={[
        'sticky top-0 z-30 border-b border-subtle',
        'bg-[var(--nav-bg)]',
      ].join(' ')}
    >
      <div className="flex w-full flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
        {/* Row 1: logo + wallet (mobile simplified, desktop full) */}
        <div className="flex w-full items-center justify-between gap-3">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center"
            >
              <ArcflowLogo compact className="h-8 sm:h-9 md:h-10" />
            </motion.div>
          </Link>

          {/* Wallet area */}
          {/* Mobile: simple button only */}
          <div className="flex items-center sm:hidden">
            {!isConnected ? (
              <Button
                variant="primary"
                size="sm"
                loading={connectStatus === 'pending'}
                onClick={() => {
                  if (mainConnector) connect({ connector: mainConnector })
                }}
                className="px-3 py-1 text-[11px]"
              >
                Connect
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => disconnect()}
                className="px-3 py-1 text-[11px]"
              >
                Disconnect
              </Button>
            )}
          </div>

          {/* Tablet / Desktop: full chip */}
          <div className="hidden items-center justify-end sm:flex sm:flex-1">
            <Card className="flex max-w-xs flex-shrink-0 items-center gap-2 rounded-full border border-subtle bg-surface-sunken px-3 py-2 text-[11px]">
              <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                Testnet
              </span>

              <span className="max-w-[140px] truncate font-mono text-[11px] text-ink-muted">
                {shortAddress}
              </span>

              {!isConnected ? (
                <Button
                  variant="primary"
                  size="sm"
                  loading={connectStatus === 'pending'}
                  onClick={() => {
                    if (mainConnector) connect({ connector: mainConnector })
                  }}
                  className="px-2.5 py-1 text-[11px]"
                >
                  Connect
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => disconnect()}
                  className="px-2.5 py-1 text-[11px]"
                >
                  Disconnect
                </Button>
              )}
            </Card>
          </div>
        </div>

        {/* Row 2: icon-only Dashboard link to /dashboard */}
        <div className="flex w-full justify-center">
          <NavLink
            to="/dashboard"
            end
            aria-label="Go to dashboard"
            className={({ isActive }) =>
              [
                'inline-flex items-center justify-center',
                'h-9 w-9 sm:h-10 sm:w-10',
                'rounded-full border border-subtle bg-surface-sunken/90',
                'text-ink-soft hover:bg-surface-sunken hover:border-[var(--brand-400)] hover:text-ink-primary transition-colors',
                'shadow-sm',
                isActive &&
                  'border-[var(--brand-400)] bg-surface-sunken text-[var(--brand-50)]',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            <Home className="h-4 w-4" />
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
