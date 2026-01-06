import type { ReactNode } from 'react'
import { Card } from '../../../components/ui/Card'

interface Props {
  title: string
  badgeText?: string
  headline: string
  subline?: string

  rightLabel?: string
  rightValue?: string
  rightIcon?: ReactNode
  onRightClick?: () => void

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
  /* ===============================
     COLOR SYSTEM (INLINE, FINAL)
     =============================== */

  const background = muted
    ? 'linear-gradient(135deg, #020912 0%, #051324 55%, #081c36 100%)'
    : 'linear-gradient(135deg, #0a2648 0%, #0c2b51 55%, #113e75 100%)'

  const glow = muted
    ? 'radial-gradient(900px 220px at 25% 20%, rgba(255,255,255,0.04), transparent 60%)'
    : 'radial-gradient(900px 220px at 25% 20%, rgba(255,255,255,0.14), transparent 60%)'

  const textPrimary = muted ? 'rgba(255,255,255,0.78)' : '#ffffff'
  const textSecondary = muted ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.7)'

  const pillBg = muted ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.10)'
  const pillBorder = muted ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)'
  const pillText = muted ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.9)'

  const buttonBg = muted ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.10)'
  const buttonBorder = muted ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)'
  const buttonText = muted ? 'rgba(255,255,255,0.7)' : '#ffffff'

  return (
    <Card
      className="relative overflow-hidden rounded-[18px]"
      style={{
        background,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 18px 42px rgba(2, 6, 23, 0.25)',
      }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />

      <div className="relative px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* LEFT */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                className="text-[18px] sm:text-[20px] md:text-[22px] font-semibold leading-none"
                style={{ color: textPrimary }}
              >
                {title}
              </h2>

              {badgeText && (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-[6px] text-[11px] sm:text-[12px] font-medium"
                  style={{
                    background: pillBg,
                    border: `1px solid ${pillBorder}`,
                    color: pillText,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: muted ? '#64748b' : '#34d399' }}
                  />
                  {badgeText}
                </span>
              )}
            </div>

            <div
              className="mt-2 text-[15px] sm:text-[18px] md:text-[20px] font-semibold leading-snug"
              style={{ color: textPrimary }}
            >
              {headline}
            </div>

            {subline && (
              <div
                className="mt-1 text-[12px] sm:text-[13px]"
                style={{ color: textSecondary }}
              >
                {subline}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="w-full md:w-auto shrink-0">
            <div className="flex flex-col gap-2 md:items-end">
              <span
                className="text-[12px]"
                style={{ color: textSecondary }}
              >
                {rightLabel || '\u00A0'}
              </span>

              <button
                type="button"
                onClick={onRightClick}
                disabled={muted}
                className="h-[38px] px-4 rounded-full text-[13px] font-medium inline-flex items-center gap-2"
                style={{
                  background: buttonBg,
                  border: `1px solid ${buttonBorder}`,
                  color: buttonText,
                  cursor: muted ? 'default' : 'pointer',
                }}
              >
                <span className="truncate max-w-[240px]">
                  {rightValue || '—'}
                </span>
                {rightIcon && <span style={{ opacity: 0.8 }}>{rightIcon}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
