interface Props {
  status: string
}

const TOKENS = {
  success: '#16A34A',
  info: '#2563EB',
  warning: '#F59E0B',
  danger: '#DC2626',
  textSecondary: '#475569',
}

function pillStyle(kind: 'success' | 'info' | 'warning' | 'danger' | 'neutral') {
  if (kind === 'success') return { bg: 'rgba(22,163,74,0.12)', fg: TOKENS.success }
  if (kind === 'info') return { bg: 'rgba(37,99,235,0.12)', fg: TOKENS.info }
  if (kind === 'warning') return { bg: 'rgba(245,158,11,0.14)', fg: TOKENS.warning }
  if (kind === 'danger') return { bg: 'rgba(220,38,38,0.12)', fg: TOKENS.danger }
  return { bg: 'rgba(15,23,42,0.06)', fg: TOKENS.textSecondary }
}

export function StatusPill({ status }: Props) {
  const raw = (status ?? '').trim()
  const normalized = raw.toLowerCase()

  // Deterministic mapping (no guessing beyond string checks)
  let kind: 'success' | 'info' | 'warning' | 'danger' | 'neutral' = 'neutral'

  // success
  if (normalized.includes('active') || normalized.includes('completed')) {
    kind = 'success'
  }

  // info / onchain
  if (
    normalized.includes('onchain') ||
    normalized.includes('created') ||
    normalized.includes('deployed') ||
    normalized.includes('confirmed')
  ) {
    kind = 'info'
  }

  // warning
  if (
    normalized.includes('pending') ||
    normalized.includes('queued') ||
    normalized.includes('processing') ||
    normalized.includes('waiting')
  ) {
    kind = 'warning'
  }

  // danger
  if (normalized.includes('failed') || normalized.includes('error') || normalized.includes('reverted')) {
    kind = 'danger'
  }

  const s = pillStyle(kind)

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-[10px] h-7 text-[12px] font-medium capitalize"
      style={{ background: s.bg, color: s.fg }}
      title={raw}
    >
      {raw || 'unknown'}
    </span>
  )
}
