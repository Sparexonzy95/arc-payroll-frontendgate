import { Button } from '../../../../components/ui/Button'
import { UI } from '../ui'
import type { Step } from '../types'
import { IconPlus } from '@tabler/icons-react'

export function StepHeader({
  step,
  subtitle,
  employerName,
  onCancel,
  onAddRecipient,
}: {
  step: Step
  subtitle: string
  employerName: string
  onCancel: () => void
  onAddRecipient?: () => void
}) {
  return (
    <div className="px-5 sm:px-7 py-6 sm:py-7" style={{ borderBottom: `1px solid ${UI.borderSoft}` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] sm:text-[30px] font-semibold"  style={{ color: UI.navy }}>
            Create Payroll
          </h1>
          <p className="mt-1 text-[13px] sm:text-[14px]" style={{ color: UI.subtext }}>
            {subtitle}
          </p>

          {step === 1 && (
            <div className="mt-4">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-medium"
                style={{
                  background: 'rgba(14,42,85,0.10)',
                  border: `1px solid rgba(14,42,85,0.16)`,
                  color: UI.navy,
                }}
              >
                {employerName}
              </span>
            </div>
          )}

          {step === 2 && onAddRecipient && (
            <div className="mt-4">
             <Button
  size="sm"
  variant="secondary"
  className="gap-2 rounded-full h-9 px-5"
  onClick={onAddRecipient}
>
                <IconPlus size={18} />
                Add recipient
              </Button>
            </div>
          )}
        </div>

        <Button size="sm" variant="secondary" onClick={onCancel} className="h-9 px-4 rounded-[10px]">
          Cancel setup
        </Button>
      </div>
    </div>
  )
}
