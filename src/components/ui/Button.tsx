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
    'inline-flex items-center justify-center rounded-full font-medium font-body transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)] ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-body)] ' +
    'disabled:opacity-60 disabled:cursor-not-allowed'

  const sizeClass =
    size === 'sm'
      ? 'px-4 py-2 text-[12px]'
      : 'px-6 py-3 text-[14px]'

  const variants: Record<'primary' | 'secondary' | 'ghost', string> = {
    /** ✅ TRUE PRIMARY — #0c2b51 */
    primary:
      'bg-[color:var(--brand-800)] text-white ' +
      'hover:bg-[color:var(--brand-700)] ' +
      'active:bg-[color:var(--brand-900)]',

    /** Secondary = outlined, calm */
    secondary:
      'bg-transparent text-[color:var(--brand-800)] ' +
      'border border-[color:var(--brand-300)] ' +
      'hover:border-[color:var(--brand-500)] ' +
      'hover:bg-[color:var(--brand-50)]',

    /** Ghost = no chrome */
    ghost:
      'bg-transparent text-ink-muted ' +
      'hover:bg-surface-sunken',
  }

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={clsx(base, sizeClass, variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {children}
    </motion.button>
  )
}
