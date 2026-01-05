// src/pages/dashboard/components/DashboardBanner.tsx
import type { ReactNode } from 'react'
import { Card } from '../../../components/ui/Card'

interface Props {
  title: string
  badgeText?: string
  headline: string
  subline?: string

  // ✅ Same right block everywhere
  rightLabel?: string
  rightValue?: string
  rightIcon?: ReactNode
  onRightClick?: () => void

  // ✅ NEW: muted/disabled style (for Coming Soon tabs like Staking)
  muted?: boolean
}

export function DashboardBanner({
  title,
  badgeText,
  headline,
  subline,
  rightLabel = '',
  rightValue = '',
  rightIcon,
  onRightClick,
  muted = false,
}: Props) {
  const bg = muted
    ? 'linear-gradient(135deg, rgba(12,18,35,1) 0%, rgba(18,28,54,1) 55%, rgba(12,18,35,1) 100%)'
    : 'linear-gradient(135deg, rgba(10,33,74,1) 0%, rgba(22,60,126,1) 55%, rgba(10,33,74,1) 100%)'

  const glow = muted
    ? 'radial-gradient(900px 220px at 25% 25%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.00) 60%)'
    : 'radial-gradient(900px 220px at 25% 25%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.00) 60%)'

  const textPrimary = muted ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,1)'
  const textSecondary = muted ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.70)'

  const pillBg = muted ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.10)'
  const pillBorder = muted ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'
  const pillText = muted ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.90)'

  const dotColor = muted ? 'bg-slate-400' : 'bg-emerald-400'

  const buttonBg = muted ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.10)'
  const buttonBorder = muted ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'
  const buttonText = muted ? 'rgba(255,255,255,0.76)' : 'rgba(255,255,255,0.92)'

  return (
    <Card
      className="relative overflow-hidden rounded-[18px]"
      style={{
        background: bg,
        boxShadow: '0 18px 42px rgba(2, 6, 23, 0.22)',
        border: `1px solid ${muted ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.55]" style={{ background: glow }} />

      <div className="relative px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
          {/* LEFT */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                className="text-[18px] sm:text-[20px] md:text-[22px] font-semibold leading-none"
                style={{ color: textPrimary }}
              >
                {title}
              </h2>

              {badgeText ? (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-[6px] text-[11px] sm:text-[12px] font-medium"
                  style={{
                    background: pillBg,
                    border: `1px solid ${pillBorder}`,
                    color: pillText,
                  }}
                >
                  <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                  {badgeText}
                </span>
              ) : null}
            </div>

            <div
              className="mt-2 text-[15px] sm:text-[18px] md:text-[20px] font-semibold leading-snug"
              style={{ color: textPrimary }}
            >
              {headline}
            </div>

            {subline ? (
              <div className="mt-1 text-[12px] sm:text-[13px]" style={{ color: textSecondary }}>
                {subline}
              </div>
            ) : (
              <div className="mt-1 text-[12px] sm:text-[13px] opacity-0 select-none">.</div>
            )}
          </div>

          {/* RIGHT (ALWAYS PRESENT) */}
          <div className="w-full md:w-auto shrink-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:flex-col md:items-end md:justify-start">
              <span className="text-[12px]" style={{ color: textSecondary }}>
                {rightLabel || '\u00A0'}
              </span>

              <button
                type="button"
                onClick={onRightClick}
                className="h-[38px] w-full md:w-auto px-4 rounded-full text-[13px] font-medium inline-flex items-center justify-between gap-2"
                style={{
                  background: buttonBg,
                  border: `1px solid ${buttonBorder}`,
                  color: buttonText,
                  cursor: muted ? 'default' : 'pointer',
                  opacity: muted ? 0.9 : 1,
                }}
                aria-disabled={muted ? true : undefined}
              >
                <span className="truncate max-w-[70vw] sm:max-w-[280px] md:max-w-[240px]">
                  {rightValue || '—'}
                </span>
                {rightIcon ? <span style={{ opacity: muted ? 0.6 : 0.9 }}>{rightIcon}</span> : null}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
