import { IconCheck, IconCircle } from '@tabler/icons-react'
import { UI } from '../ui'

export function ReqRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: done ? '#16A34A' : UI.muted }}>
        {done ? <IconCheck size={16} /> : <IconCircle size={14} />}
      </span>
      <span>{label}</span>
    </div>
  )
}
