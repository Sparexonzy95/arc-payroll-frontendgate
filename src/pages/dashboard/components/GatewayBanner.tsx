// src/pages/dashboard/components/GatewayBanner.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowsExchange2,
  IconArrowsLeftRight,
  IconArrowsRightLeft,
} from '@tabler/icons-react'

type Direction = 'arc-base' | 'base-arc'

interface Props {
  environmentLabel?: string
  environmentValue?: string
  defaultDirection?: Direction
  onDirectionChange?: (dir: Direction) => void
}

const PILL_ICON = { size: 16, stroke: 2 }

export function GatewayBanner({
  environmentLabel = 'ENVIRONMENT',
  environmentValue = 'Arc · Base Sepolia',
  defaultDirection = 'arc-base',
  onDirectionChange,
}: Props) {
  const [dir, setDir] = useState<Direction>(defaultDirection)

  // Keep internal state synced if parent changes defaultDirection
  useEffect(() => {
    setDir(defaultDirection)
  }, [defaultDirection])

  const pills = useMemo(() => {
    return [
      {
        key: 'gateway',
        label: 'GATEWAY BRIDGE',
        icon: <IconArrowsExchange2 {...PILL_ICON} />,
        active: true,
        onClick: () => {},
      },
      {
        key: 'arc-base',
        label: 'ARC → BASE',
        icon: <IconArrowsRightLeft {...PILL_ICON} />,
        active: dir === 'arc-base',
        onClick: () => {
          setDir('arc-base')
          onDirectionChange?.('arc-base')
        },
      },
      {
        key: 'base-arc',
        label: 'BASE → ARC',
        icon: <IconArrowsLeftRight {...PILL_ICON} />,
        active: dir === 'base-arc',
        onClick: () => {
          setDir('base-arc')
          onDirectionChange?.('base-arc')
        },
      },
    ]
  }, [dir, onDirectionChange])

  return (
    <section
      className="relative overflow-hidden rounded-[18px] border"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
        background:
          'linear-gradient(135deg, rgba(10,33,74,1) 0%, rgba(22,60,126,1) 55%, rgba(10,33,74,1) 100%)',
        boxShadow: '0 18px 42px rgba(2, 6, 23, 0.22)',
      }}
    >
      {/* soft highlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            'radial-gradient(900px 220px at 22% 30%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.00) 62%)',
        }}
      />

      {/* subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.00) 38%, rgba(255,255,255,0.05) 100%)',
        }}
      />

      <div className="relative px-4 py-4 sm:px-6 sm:py-6">
        {/* ✅ Use layout that never overflows: stack on mobile, split on lg */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          {/* LEFT */}
          <div className="min-w-0 flex-1">
            {/* Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {pills.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={p.onClick}
                  aria-pressed={p.active}
                  className={[
                    // ✅ responsive pill sizing
                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5',
                    'text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wide',
                    'transition',
                    // ✅ never overflow on tiny screens
                    'max-w-full min-w-0',
                  ].join(' ')}
                  style={{
                    background: p.active
                      ? 'rgba(255,255,255,0.14)'
                      : 'rgba(255,255,255,0.08)',
                    border: p.active
                      ? '1px solid rgba(255,255,255,0.16)'
                      : '1px solid rgba(255,255,255,0.10)',
                    color: p.active
                      ? 'rgba(255,255,255,0.94)'
                      : 'rgba(255,255,255,0.78)',
                  }}
                >
                  <span className="shrink-0" style={{ opacity: p.active ? 1 : 0.9 }}>
                    {p.icon}
                  </span>

                  {/* ✅ truncate safely if a device is super narrow */}
                  <span className="truncate">
                    {/* Slightly shorter labels on ultra-small screens */}
                    <span className="sm:hidden">
                      {p.key === 'arc-base'
                        ? 'ARC→BASE'
                        : p.key === 'base-arc'
                        ? 'BASE→ARC'
                        : p.label}
                    </span>
                    <span className="hidden sm:inline">{p.label}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* ✅ fluid type scale */}
            <h2 className="mt-3 text-[18px] leading-tight text-white sm:text-[22px] lg:text-[24px] font-semibold">
              Move USDC seamlessly across chains
            </h2>

            {/* ✅ copy never causes overflow */}
            <p
              className="mt-2 max-w-3xl text-[12px] leading-relaxed sm:text-[13px]"
              style={{ color: 'rgba(255,255,255,0.74)' }}
            >
              Bridge USDC between Arc Testnet and Base Sepolia via Circle Gateway. Fund payrolls
              from the right chain at the right time.
            </p>

            {/* ✅ direction hint wraps properly */}
            <div
              className="mt-3 text-[12px] font-medium break-words"
              style={{ color: 'rgba(255,255,255,0.82)' }}
            >
              Current route:{' '}
              <span style={{ color: 'rgba(255,255,255,0.95)' }}>
                {dir === 'arc-base' ? 'Arc → Base' : 'Base → Arc'}
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="w-full lg:w-auto lg:shrink-0">
            {/* ✅ on mobile it becomes full-width, on desktop it hugs content */}
            <div
              className="rounded-xl px-4 py-3 w-full lg:w-auto"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'rgba(255,255,255,0.70)' }}
              >
                {environmentLabel}
              </div>

              {/* ✅ ensure very long env strings don’t overflow */}
              <div
                className="mt-1 text-[12px] sm:text-[12.5px] font-medium break-words"
                style={{ color: 'rgba(255,255,255,0.90)' }}
              >
                {environmentValue}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
