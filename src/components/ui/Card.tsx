import type { ReactNode, CSSProperties } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

const TOKENS = {
  bgCard: '#FFFFFF',
  border: 'rgba(15,23,42,0.06)',
  textPrimary: '#0F172A',
}

/**
 * Deterministic Card
 * - Default Background: token bg.card
 * - Default Border: subtle divider
 * - Default Radius: 14 (lg)
 * - Motion: subtle only (hover translateY -1)
 *
 * NOTE:
 * We now allow style overrides (e.g. banner gradients) by merging styles.
 */
export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-[14px] border p-4',
        'transition-[background,color,transform] duration-[150ms] ease-out',
        'hover:-translate-y-[1px]',
        className
      )}
      style={{
        background: TOKENS.bgCard,
        borderColor: TOKENS.border,
        color: TOKENS.textPrimary,
        ...style, // ✅ allow overrides from callers (Dashboard banner)
      }}
    >
      {children}
    </div>
  )
}
