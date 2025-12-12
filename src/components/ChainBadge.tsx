// src/components/ChainBadge.tsx
interface Props {
  name: string
  chainId: number
}

export function ChainBadge({ name }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full',
        'px-3 py-1.5',
        'text-[12px] md:text-[13px] font-medium',
        // monochromatic brand blue
        'border border-[var(--brand-400)]',
        'bg-[rgba(65,137,225,0.16)]',
        'text-[var(--brand-50)]',
      ].join(' ')}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-400)]" />
      <span className="font-heading tracking-tight">{name}</span>
    </span>
  )
}
