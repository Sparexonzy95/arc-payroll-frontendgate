// src/features/employer/EmployerSelector.tsx
import type { Employer } from '../../api/employers'
import { Select } from '../../components/ui/Select'

interface Props {
  employers: Employer[] | undefined
  activeEmployerId: number | null
  setActiveEmployerId: (id: number) => void
}

export function EmployerSelector({
  employers,
  activeEmployerId,
  setActiveEmployerId,
}: Props) {
  if (!employers || employers.length === 0) return null

  return (
    <div className="flex items-center gap-2 text-[11px] text-ink-soft">
      <span className="hidden text-[11px] sm:inline">
        Employer:
      </span>

      <Select
        value={activeEmployerId ?? ''}
        onChange={(e) => setActiveEmployerId(Number(e.target.value))}
        className="w-40 rounded-lg border-subtle bg-surface-sunken px-2 py-1 text-[11px] text-ink-primary"
      >
        <option value="" disabled>
          Select employer
        </option>
        {employers.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name || 'Unnamed employer'}
          </option>
        ))}
      </Select>
    </div>
  )
}
