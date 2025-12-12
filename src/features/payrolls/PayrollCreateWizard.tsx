import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

import {
  useChains,
  useTokens,
  filterTokensByChain,
} from '../../hooks/useChains'

import { useWalletEmployerBinding } from '../../hooks/useWalletEmployerBinding'
import { useCreatePayroll } from '../../hooks/hooks/usePayrolls'

import type { ScheduleType, PaymentPayload } from '../../api/payrolls'
import type { TokenDTO, ChainDTO } from '../../api/chains'

import toast from 'react-hot-toast'

// --------------------------------------------------------

type Step = 1 | 2 | 3 | 4

interface EmployeeRow extends PaymentPayload {
  index: number
}

export function PayrollCreateWizard() {
  const navigate = useNavigate()
  const { data: chains } = useChains()
  const { data: tokens } = useTokens()

  const {
    activeEmployerId,
    needsOnboarding,
    isWalletConnected,
    boundEmployer,
  } = useWalletEmployerBinding()

  const createPayroll = useCreatePayroll()
  const [step, setStep] = useState<Step>(1)

  // Step 1 Data
  const [sourceChainId, setSourceChainId] = useState<number | ''>('')
  const [defaultTokenAddress, setDefaultTokenAddress] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Step 2 Data
  const [employees, setEmployees] = useState<EmployeeRow[]>([
    {
      index: 0,
      employee_address: '',
      token_address: '',
      net_human: '',
      tax_human: '',
      encrypted_ref: '0x',
    },
  ])

  // Step 3 Data
  const [scheduleType, setScheduleType] = useState<ScheduleType>('instant')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('09:00')
  const [dayOfMonth, setDayOfMonth] = useState<number | ''>('')

  // --------------------------------------------------------
  // Restrict payroll: ONLY ARC TESTNET allowed
  // --------------------------------------------------------

  const arcChains = (chains || []).filter(
    (c) => c.name.toLowerCase().includes('arc')
  )

  const filteredTokens = filterTokensByChain(
    tokens,
    typeof sourceChainId === 'number' ? sourceChainId : undefined
  )

  function currentChain(): ChainDTO | undefined {
    if (!arcChains || !sourceChainId) return undefined
    return arcChains.find((c) => c.id === sourceChainId)
  }

  function currentToken(): TokenDTO | undefined {
    if (!defaultTokenAddress) return undefined
    return filteredTokens.find(
      (t) => t.address.toLowerCase() === defaultTokenAddress.toLowerCase()
    )
  }

  // --------------------------------------------------------
  // EMPLOYEE LOGIC
  // --------------------------------------------------------

  function addEmployee() {
    setEmployees((prev) => [
      ...prev,
      {
        index: prev.length,
        employee_address: '',
        token_address: '',
        net_human: '',
        tax_human: '',
        encrypted_ref: '0x',
      },
    ])
  }

  function removeEmployee(index: number) {
    setEmployees((prev) => prev.filter((row) => row.index !== index))
  }

  function updateEmployee(
    index: number,
    field: keyof PaymentPayload,
    value: string
  ) {
    setEmployees((prev) =>
      prev.map((row) =>
        row.index === index ? { ...row, [field]: value } : row
      )
    )
  }

  // --------------------------------------------------------
  // STEP NAV
  // --------------------------------------------------------

  function handleNext() {
    if (step === 1) {
      if (!sourceChainId) return toast.error('Select source chain')
      if (!defaultTokenAddress) return toast.error('Select default token')
      if (!title.trim()) return toast.error('Enter a payroll title')
    }

    if (step === 2) {
      const valid = employees.some((e) => e.employee_address && e.net_human)
      if (!valid) return toast.error('Add at least one employee row')
    }

    if (step === 3) {
      if (!startAt) return toast.error('Select start date')
      if (
        (scheduleType === 'monthly' || scheduleType === 'yearly') &&
        !dayOfMonth
      ) {
        return toast.error('Enter valid day of month')
      }
    }

    setStep((p) => Math.min(4, p + 1) as Step)
  }

  function handleBack() {
    setStep((p) => Math.max(1, p - 1) as Step)
  }

  // --------------------------------------------------------
  // SUBMIT
  // --------------------------------------------------------

  async function handleSubmit() {
    if (!isWalletConnected || !activeEmployerId) {
      return toast.error('Connect wallet & employer first')
    }

    const startIso = startAt
      ? new Date(startAt).toISOString()
      : new Date().toISOString()

    const endIso = endAt ? new Date(endAt).toISOString() : null

    const timeSeconds =
      scheduleType === 'instant'
        ? null
        : (() => {
            const [h, m] = timeOfDay.split(':').map(Number)
            return h * 3600 + m * 60
          })()

    const day =
      scheduleType === 'monthly' || scheduleType === 'yearly'
        ? Number(dayOfMonth || 1)
        : null

    const payments = employees
      .filter((e) => e.employee_address && e.net_human)
      .map((e) => ({
        employee_address: e.employee_address,
        token_address: defaultTokenAddress,
        net_human: e.net_human,
        tax_human: e.tax_human || '0',
        encrypted_ref: e.encrypted_ref || '0x',
      }))

    if (!payments.length) {
      return toast.error('No valid employee rows')
    }

    try {
      const payload = {
        employer: activeEmployerId,
        source_chain: sourceChainId as number,
        title: title.trim(),
        description: description.trim(),
        default_token_address: defaultTokenAddress,
        schedule: {
          type: scheduleType,
          start_at: startIso,
          end_at: endIso,
          time_of_day_seconds: timeSeconds,
          day_of_month: day,
        },
        payments,
      }

      const created = await createPayroll.mutateAsync(payload)
      toast.success('Payroll created')
      navigate(`/payrolls/${created.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Error creating payroll')
    }
  }

  // --------------------------------------------------------
  // BLOCKERS
  // --------------------------------------------------------

  if (!isWalletConnected) {
    return (
      <Card className="mx-auto w-full max-w-xl border-subtle bg-surface-elevated px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-base sm:text-lg text-ink-soft">
          Connect your wallet to continue.
        </p>
      </Card>
    )
  }

  if (needsOnboarding || !boundEmployer) {
    return (
      <Card className="mx-auto w-full max-w-xl border-subtle bg-surface-elevated px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-base sm:text-lg text-ink-soft">
          Complete employer onboarding from the Dashboard.
        </p>
      </Card>
    )
  }

  const chain = currentChain()
  const token = currentToken()
  const validEmployeeCount = employees.filter(
    (e) => e.employee_address && e.net_human
  ).length

  const scheduleLabel =
    scheduleType === 'instant'
      ? 'Instant'
      : scheduleType === 'daily'
      ? 'Daily'
      : scheduleType === 'monthly'
      ? 'Monthly'
      : 'Yearly'

  const hasScheduleDetails = Boolean(startAt)
  const hasBasics = !!sourceChainId && !!defaultTokenAddress && !!title.trim()
  const hasEmployees = validEmployeeCount > 0

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------

  return (
    <Card className="mx-auto w-full max-w-4xl rounded-2xl border-subtle bg-surface-elevated px-4 py-6 shadow-soft sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="flex w-full flex-col gap-8 md:gap-10">
        {/* Title */}
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink-primary">
            Create new payroll
          </h1>
          <p className="mt-2 text-sm sm:text-base text-ink-soft">
            Step {step} of 4 • {boundEmployer.name}
          </p>
        </div>

        {/* STEPPER MOBILE: simple bar, no overflow */}
        <div className="rounded-xl bg-surface-sunken px-3 py-2 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-ink-soft">
              Step {step} of 4
            </span>
            <div className="flex-1 h-1 rounded-full bg-border-muted">
              <div
                className="h-1 rounded-full bg-[#4189e1]"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* STEPPER DESKTOP/TABLET: full pills, wraps if needed */}
        <div className="hidden w-full sm:block">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm md:text-base">
            {[
              { n: 1, label: 'Basics' },
              { n: 2, label: 'Employees' },
              { n: 3, label: 'Schedule' },
              { n: 4, label: 'Review' },
            ].map((s, idx) => (
              <div
                key={s.n}
                className="flex items-center gap-3"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm md:h-11 md:w-11 md:text-base ${
                    step >= s.n
                      ? 'bg-[#4189e1] text-[#020817]'
                      : 'bg-surface-sunken text-ink-soft'
                  }`}
                >
                  {s.n}
                </span>
                <span
                  className={
                    step >= s.n
                      ? 'font-medium text-ink-muted'
                      : 'text-ink-soft'
                  }
                >
                  {s.label}
                </span>

                {idx < 3 && (
                  <div className="hidden h-px w-10 bg-border-muted md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* STEP CONTENTS */}

        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="grid w-full gap-6 md:gap-8 md:grid-cols-2">
            <div className="space-y-5">
              {/* Chain */}
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-medium text-ink-primary">
                  Source chain
                </label>
                <Select
                  value={sourceChainId ? String(sourceChainId) : ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setSourceChainId(
                      e.target.value ? Number(e.target.value) : ''
                    )
                  }
                >
                  <option value="">Select chain</option>
                  {arcChains.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Token */}
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-medium text-ink-primary">
                  Default token
                </label>
                <Select
                  value={defaultTokenAddress}
                  onChange={(e) => setDefaultTokenAddress(e.target.value)}
                  disabled={!sourceChainId}
                >
                  <option value="">Select token</option>
                  {filteredTokens.map((t) => (
                    <option key={t.id} value={t.address}>
                      {t.symbol} ({t.address.slice(0, 5)}…
                      {t.address.slice(-4)})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-medium text-ink-primary">
                  Payroll title
                </label>
                <Input
                  className="text-base sm:text-lg"
                  placeholder="January salaries"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-medium text-ink-primary">
                  Description
                </label>
                <Input
                  className="text-base sm:text-lg"
                  placeholder="Optional note"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: EMPLOYEES */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm sm:text-base text-ink-soft">
                Add employees with net plus tax amounts.
              </p>
              <Button
                size="md"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={addEmployee}
              >
                Add employee
              </Button>
            </div>

            <div className="space-y-4">
              {employees.map((row) => (
                <div
                  key={row.index}
                  className="grid w-full gap-4 sm:gap-5 rounded-xl border border-subtle bg-surface-sunken p-4 sm:p-5 md:grid-cols-5"
                >
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm sm:text-base text-ink-primary">
                      Employee address
                    </label>
                    <Input
                      className="text-base sm:text-lg"
                      placeholder="0x…"
                      value={row.employee_address}
                      onChange={(e) =>
                        updateEmployee(
                          row.index,
                          'employee_address',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm sm:text-base text-ink-primary">
                      Net amount
                    </label>
                    <Input
                      className="text-base sm:text-lg"
                      placeholder="100.00"
                      value={row.net_human}
                      onChange={(e) =>
                        updateEmployee(
                          row.index,
                          'net_human',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm sm:text-base text-ink-primary">
                      Tax amount
                    </label>
                    <Input
                      className="text-base sm:text-lg"
                      placeholder="0.00"
                      value={row.tax_human}
                      onChange={(e) =>
                        updateEmployee(
                          row.index,
                          'tax_human',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <Button
                    size="md"
                    variant="ghost"
                    className="mt-1 w-full md:mt-0 md:w-auto md:justify-self-end"
                    disabled={employees.length === 1}
                    onClick={() => removeEmployee(row.index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: SCHEDULE */}
        {step === 3 && (
          <div className="grid w-full gap-6 md:gap-8 md:grid-cols-2">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm sm:text-base text-ink-primary">
                  Schedule type
                </label>
                <Select
                  value={scheduleType}
                  onChange={(e) =>
                    setScheduleType(e.target.value as ScheduleType)
                  }
                >
                  <option value="instant">Instant</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm sm:text-base text-ink-primary">
                  Start at
                </label>
                <Input
                  className="h-11 sm:h-12 text-base sm:text-lg [color-scheme:dark]"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm sm:text-base text-ink-primary">
                  End at (optional)
                </label>
                <Input
                  className="h-11 sm:h-12 text-base sm:text-lg [color-scheme:dark]"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-5">
              {scheduleType !== 'instant' && (
                <div className="space-y-2">
                  <label className="text-sm sm:text-base text-ink-primary">
                    Time of day
                  </label>
                  <Input
                    className="h-11 sm:h-12 text-base sm:text-lg [color-scheme:dark]"
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </div>
              )}

              {(scheduleType === 'monthly' || scheduleType === 'yearly') && (
                <div className="space-y-2">
                  <label className="text-sm sm:text-base text-ink-primary">
                    Day of month
                  </label>
                  <Input
                    className="h-11 sm:h-12 text-base sm:text-lg"
                    type="number"
                    min={1}
                    max={31}
                    value={dayOfMonth}
                    onChange={(e) =>
                      setDayOfMonth(
                        e.target.value ? Number(e.target.value) : ''
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className="w-full space-y-4 rounded-2xl border border-subtle bg-surface-sunken p-5 sm:p-6">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Overview
            </h3>

            <p className="text-base sm:text-lg text-ink-primary">
              <strong className="text-ink-primary">
                {title || 'Untitled payroll'}
              </strong>{' '}
              • {chain?.name || 'No chain selected'} {token && `• ${token.symbol}`}
            </p>

            <p className="text-sm sm:text-lg text-ink-soft">
              {validEmployeeCount} employees • schedule: {scheduleLabel}
            </p>

            {description && (
              <p className="mt-2 text-sm sm:text-lg text-ink-soft">
                {description}
              </p>
            )}
          </div>
        )}

        {/* STEP BUTTONS */}
        <div className="mt-2 flex w-full flex-col gap-3 border-t border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <Button
            size="md"
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={step === 1}
            onClick={handleBack}
          >
            Back
          </Button>

          {step < 4 ? (
            <Button
              size="md"
              className="w-full sm:w-auto"
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            <Button
              size="md"
              className="w-full sm:w-auto"
              variant="primary"
              loading={createPayroll.isPending}
              onClick={handleSubmit}
            >
              Create payroll
            </Button>
          )}
        </div>

        {/* Inline checklist */}
        <div className="w-full rounded-2xl border border-subtle bg-surface-sunken p-4 sm:p-5 text-xs sm:text-sm">
          <p className="mb-2 font-medium text-ink-soft">Checklist</p>
          <ul className="space-y-1">
            <li className={hasBasics ? 'text-emerald-300' : 'text-ink-soft'}>
              {hasBasics
                ? '✓ Basics complete'
                : '• Chain, token and title needed'}
            </li>
            <li className={hasEmployees ? 'text-emerald-300' : 'text-ink-soft'}>
              {hasEmployees
                ? '✓ Employees added'
                : '• Add at least one employee'}
            </li>
            <li
              className={hasScheduleDetails ? 'text-emerald-300' : 'text-ink-soft'}
            >
              {hasScheduleDetails
                ? '✓ Schedule configured'
                : '• Select start date'}
            </li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
