// src/components/Skeleton.tsx
import clsx from 'clsx'

const TOKENS = {
  base: 'rgba(15,23,42,0.06)',
  sheen: 'rgba(15,23,42,0.09)',
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx('animate-pulse rounded-[10px]', className)}
      style={{
        background: `linear-gradient(90deg, ${TOKENS.base}, ${TOKENS.sheen}, ${TOKENS.base})`,
        backgroundSize: '200% 100%',
        animation: 'arcflow-skeleton 1.2s ease-in-out infinite',
      }}
    />
  )
}
