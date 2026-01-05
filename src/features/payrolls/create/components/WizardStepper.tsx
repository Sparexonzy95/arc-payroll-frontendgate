import { IconCheck } from '@tabler/icons-react'
import { UI } from '../ui'
import type { Step } from '../types'

export function WizardStepper({
  step,
  steps,
}: {
  step: Step
  steps: Array<{ n: Step; title: string; subtitle: string }>
}) {
  return (
    <div className="space-y-3">
      {steps.map((s) => {
        const active = step === s.n
        const done = step > s.n
        return (
          <div
            key={s.n}
            className="rounded-[16px] px-4 py-4"
            style={{
              background: active ? `linear-gradient(180deg, rgba(14,42,85,0.85) 0%, rgba(14,42,85,0.55) 100%)` : UI.card,
              border: `1px solid ${active ? 'rgba(255,255,255,0.10)' : UI.borderSoft}`,
              boxShadow: active ? '0 18px 38px rgba(2, 6, 23, 0.18)' : 'none',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                style={{
                  background: active
                    ? 'rgba(255,255,255,0.12)'
                    : done
                    ? 'rgba(14,42,85,0.12)'
                    : 'rgba(15,23,42,0.06)',
                  color: active ? 'rgba(255,255,255,0.92)' : UI.text,
                  border: `1px solid ${active ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)'}`,
                }}
              >
                {done ? <IconCheck size={16} /> : s.n}
              </div>

              <div className="min-w-0">
                <div className="text-[16px] font-semibold" style={{ color: active ? 'rgba(255,255,255,0.92)' : UI.text }}>
                  {s.title}
                </div>
                <div className="text-[13px]" style={{ color: active ? 'rgba(255,255,255,0.70)' : UI.subtext }}>
                  {s.subtitle}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
