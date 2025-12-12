import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
}

export function Input({ label, helperText, className, ...rest }: InputProps) {
  return (
    <label className="flex flex-col gap-1 text-[13px] font-body">
      {label && (
        <span className="text-ink-primary text-[12px]">{label}</span>
      )}
      <input
        className={clsx(
          'rounded-lg border px-3 py-2 text-[13px]',
          'bg-surface-sunken border-subtle text-ink-primary placeholder:text-ink-soft',
          'focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]',
          className
        )}
        {...rest}
      />
      {helperText && (
        <span className="text-[11px] text-ink-soft">{helperText}</span>
      )}
    </label>
  )
}
