// src/features/employer/EmployerSelector.tsx
import type { Employer } from '../../api/employers'
import { Select } from '../../components/ui/Select'

interface Props {
  employers: Employer[] | undefined
  activeEmployerId: number | null
  setActiveEmployerId: (id: number) => void
}

const TOKENS = {
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  divider: 'rgba(15,23,42,0.06)',
  bg: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.18)',
}

export function EmployerSelector({
  employers,
  activeEmployerId,
  setActiveEmployerId,
}: Props) {
  if (!employers || employers.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-[12px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
        Employer:
      </span>

      <Select
        value={activeEmployerId ?? ''}
        onChange={(e) => setActiveEmployerId(Number(e.target.value))}
        className="w-44 h-10 px-3 rounded-[10px] text-[13px]"
        style={{
          background: TOKENS.bg,
          border: `1px solid ${TOKENS.border}`,
          color: '#FFFFFF',
        }}
      >
        <option value="" disabled>
          Select employer
        </option>

        {employers.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name || 'Unnamed employer'}
          </option>
        ))}
      </Select>
    </div>
  )
}
