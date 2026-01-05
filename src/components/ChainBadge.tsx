// src/components/ChainBadge.tsx
interface Props {
  name: string
  chainId: number
}

const TOKENS = {
  border: 'rgba(15,23,42,0.08)',
  bg: 'rgba(15,23,42,0.03)',
  text: '#475569', // text.secondary
  dot: '#2563EB', // status.info
}

export function ChainBadge({ name, chainId }: Props) {
  // keep chainId in signature (no breaking), but UI stays name-first
  const label = name || `Chain ${chainId}`

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-[10px] h-7 text-[12px] font-medium"
      style={{
        border: `1px solid ${TOKENS.border}`,
        background: TOKENS.bg,
        color: TOKENS.text,
      }}
      title={label}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: TOKENS.dot }}
        aria-hidden="true"
      />
      <span className="tracking-tight">{label}</span>
    </span>
  )
}
