// src/components/branding/ArcflowLogo.tsx
import type { HTMLAttributes } from 'react'

interface ArcflowLogoProps extends HTMLAttributes<SVGSVGElement> {
  /**
   * Compact mode slightly tightens the viewBox for smaller navbars.
   */
  compact?: boolean
}

/**
 * Arcflow gradient wordmark
 *
 * - Pure SVG, no background, works on dark UIs
 * - Gradient uses brand blues: var(--brand-200) → var(--brand-400) → var(--brand-50)
 * - Use className to control height (h-6, h-8, etc)
 */
export function ArcflowLogo({
  compact = false,
  className = '',
  ...rest
}: ArcflowLogoProps) {
  // Slightly different viewBox for compact vs full
  const viewBox = compact ? '0 0 260 60' : '0 0 300 60'

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label="Arcflow"
      className={['block', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <defs>
        <linearGradient
          id="arcflow-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          {/* Brand-synced gradient stops */}
          <stop offset="0%" style={{ stopColor: 'var(--brand-200)' }} />
          <stop offset="50%" style={{ stopColor: 'var(--brand-400)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--brand-50)' }} />
        </linearGradient>
      </defs>

      {/* Wordmark text */}
      <text
        x="0"
        y="42"
        fill="url(#arcflow-gradient)"
        fontFamily={`var(--font-heading), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`}
        fontSize="40"
        fontWeight="600"
        letterSpacing="-0.04em"
      >
        Arcflow
      </text>
    </svg>
  )
}
