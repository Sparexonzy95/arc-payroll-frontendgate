interface Props {
  status: string
}

export function StatusPill({ status }: Props) {
  const normalized = status.toLowerCase()
  let color = 'bg-slate-700/60 text-slate-200'

  if (normalized.includes('active') || normalized.includes('dispatched')) {
    color = 'bg-emerald-500/20 text-emerald-300'
  } else if (normalized.includes('failed')) {
    color = 'bg-rose-500/20 text-rose-300'
  } else if (normalized.includes('pending')) {
    color = 'bg-amber-500/20 text-amber-200'
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium capitalize ${color}`}
    >
      {status}
    </span>
  )
}
