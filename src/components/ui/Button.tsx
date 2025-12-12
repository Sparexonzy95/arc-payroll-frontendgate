import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-medium font-body transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-body)] ' +
    'disabled:opacity-60 disabled:cursor-not-allowed'

  const sizeClass =
    size === 'sm'
      ? 'px-3 py-1.5 text-[11px]'
      : 'px-4 py-2 text-[13px]'

  const variants: Record<string, string> = {
    primary:
      'bg-[color:var(--brand-500)] text-white hover:bg-[color:var(--brand-600)]',
    secondary:
      'bg-surface-sunken text-ink-primary border border-subtle hover:border-[color:var(--brand-500)]',
    ghost:
      'bg-transparent text-ink-muted hover:bg-surface-sunken',
  }

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={clsx(base, sizeClass, variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink-primary border-t-transparent" />
      )}
      {children}
    </motion.button>
  )
}
