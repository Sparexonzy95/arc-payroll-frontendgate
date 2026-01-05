import { Button } from '../../../../components/ui/Button'

export function StepFooter({
  step,
  backDisabled,
  nextDisabled,
  submitDisabled,
  submitting,
  onBack,
  onNext,
  onSubmit,
}: {
  step: 1 | 2 | 3 | 4
  backDisabled: boolean
  nextDisabled: boolean
  submitDisabled: boolean
  submitting: boolean
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <Button size="md" variant="secondary" className="rounded-full px-8" disabled={backDisabled} onClick={onBack}>
        Back
      </Button>

      {step < 4 ? (
        <Button size="md" className="px-10 rounded-full" onClick={onNext} disabled={nextDisabled}>
          Next
        </Button>
      ) : (
        <Button
          size="md"
          className="px-10 rounded-full"
          variant="primary"
          loading={submitting}
          onClick={onSubmit}
          disabled={submitDisabled}
        >
          Create payroll
        </Button>
      )}
    </div>
  )
}
