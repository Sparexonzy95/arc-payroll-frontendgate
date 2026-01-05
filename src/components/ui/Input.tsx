import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
}

const TOKENS = {
  bg: '#FFFFFF',
  border: 'rgba(15,23,42,0.08)',
  divider: 'rgba(15,23,42,0.06)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  focusRing: 'rgba(37, 99, 235, 0.45)',
}

export function Input({ label, helperText, className, ...rest }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="text-[12px] font-medium" style={{ color: TOKENS.textSecondary }}>
          {label}
        </span>
      )}

      <input
        className={clsx(
          // geometry
          'h-10 rounded-[10px] px-3 text-[14px]',
          // motion rules
          'transition-[background,color,transform,border-color,box-shadow] duration-[150ms] ease-out',
          // focus/disabled
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
      />

      {helperText && (
        <span className="text-[12px]" style={{ color: TOKENS.textMuted }}>
          {helperText}
        </span>
      )}
    </label>
  )
}
