import type { SelectHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  children: ReactNode
}

const TOKENS = {
  bg: '#FFFFFF',
  border: 'rgba(15,23,42,0.08)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  focusRing: 'rgba(37, 99, 235, 0.45)',
}

export function Select({ label, helperText, className, children, ...rest }: SelectProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="text-[12px] font-medium" style={{ color: TOKENS.textSecondary }}>
          {label}
        </span>
      )}

      <select
        className={clsx(
          'h-10 rounded-[10px] px-3 text-[14px]',
          'transition-[background,color,transform,border-color,box-shadow] duration-[150ms] ease-out',
          'focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed',
          className
        )}
        style={{
          background: TOKENS.bg,
          border: `1px solid ${TOKENS.border}`,
          color: TOKENS.textPrimary,
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${TOKENS.focusRing}`
          e.currentTarget.style.borderColor = 'rgba(37,99,235,0.45)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = ''
          e.currentTarget.style.borderColor = TOKENS.border
        }}
        {...rest}
      >
        {children}
      </select>

      {helperText && (
        <span className="text-[12px]" style={{ color: TOKENS.textMuted }}>
          {helperText}
        </span>
      )}
    </label>
  )
}
