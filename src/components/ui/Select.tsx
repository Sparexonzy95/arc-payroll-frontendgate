import type { SelectHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  children: ReactNode
}

export function Select({
  label,
  helperText,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <label className="flex flex-col gap-1 text-[13px] font-body">
      {label && (
        <span className="text-ink-primary text-[12px]">{label}</span>
      )}
      <select
        className={clsx(
          'rounded-lg border px-3 py-2 text-[13px]',
          'bg-surface-sunken border-subtle text-ink-primary',
          'focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {helperText && (
        <span className="text-[11px] text-ink-soft">{helperText}</span>
      )}
    </label>
  )
}
