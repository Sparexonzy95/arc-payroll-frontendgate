import { useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

import { useChains, useTokens, filterTokensByChain } from '../../hooks/useChains'
import { useWalletEmployerBinding } from '../../hooks/useWalletEmployerBinding'
import { useCreatePayroll } from '../../hooks/hooks/usePayrolls'

import type { ScheduleType, PaymentPayload } from '../../api/payrolls'
import type { TokenDTO, ChainDTO } from '../../api/chains'

import {
  IconPlus,
  IconTrash,
  IconCheck,
  IconCircle,
  IconCalendar,
  IconBolt,
  IconRepeat,
  IconClock,
} from '@tabler/icons-react'

import toast from 'react-hot-toast'

type Step = 1 | 2 | 3 | 4
type ScheduleMode = 'immediate' | 'scheduled' | 'recurring'

interface EmployeeRow extends PaymentPayload {
  index: number
}

const UI = {
  navy: '#0E2A55',
  navy2: '#0B2A52',
  border: 'rgba(15,23,42,0.08)',
  borderSoft: 'rgba(15,23,42,0.06)',
  text: '#0F172A',
  subtext: '#475569',
  muted: '#94A3B8',
  card: '#FFFFFF',
  bg: '#F7F9FC',
  shadow: '0 18px 48px rgba(2, 6, 23, 0.10)',
}

function shortAddr(addr?: string) {
  if (!addr) return '—'
  const a = String(addr)
  if (a.length < 10) return a
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

function toNum(v: string) {
  const n = Number(String(v ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

function fmt2(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmt4(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function ReqRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: done ? '#16A34A' : UI.muted }}>{done ? <IconCheck size={16} /> : <IconCircle size={14} />}</span>
      <span>{label}</span>
    </div>
  )
}

export function PayrollCreateWizard() {
  const navigate = useNavigate()
  const { data: chains } = useChains()
  const { data: tokens } = useTokens()

  const { activeEmployerId, needsOnboarding, isWalletConnected, boundEmployer } = useWalletEmployerBinding()

  const createPayroll = useCreatePayroll()
  const [step, setStep] = useState<Step>(1)

  // Step 1 (Basics)
  const [sourceChainId, setSourceChainId] = useState<number | ''>('')
  const [defaultTokenAddress, setDefaultTokenAddress] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Step 2 (Recipients)
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

  // Step 3 (Schedule)
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('immediate')
  const [scheduleType, setScheduleType] = useState<ScheduleType>('instant') // keep your existing type
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('09:00')
  const [dayOfMonth, setDayOfMonth] = useState<number | ''>('')

  // Restrict to Arc (as you had)
  const arcChains = (chains || []).filter((c) => c.name.toLowerCase().includes('arc'))
  const filteredTokens = filterTokensByChain(tokens, typeof sourceChainId === 'number' ? sourceChainId : undefined)

  function currentChain(): ChainDTO | undefined {
    if (!arcChains || !sourceChainId) return undefined
    return arcChains.find((c) => c.id === sourceChainId)
  }
  function currentToken(): TokenDTO | undefined {
    if (!defaultTokenAddress) return undefined
    return filteredTokens.find((t) => t.address.toLowerCase() === defaultTokenAddress.toLowerCase())
  }

  // Employees helpers
  function addEmployee() {
    setEmployees((prev) => [
      ...prev,
      {
        index: prev.length ? Math.max(...prev.map((p) => p.index)) + 1 : 0,
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

  function updateEmployee(index: number, field: keyof PaymentPayload, value: string) {
    setEmployees((prev) => prev.map((row) => (row.index === index ? { ...row, [field]: value } : row)))
  }

  const chain = currentChain()
  const token = currentToken()
  const symbol = token?.symbol || 'USDC'

  const recipientsCount = employees.filter((e) => e.employee_address.trim()).length
  const netTotal = employees.reduce((acc, e) => acc + toNum(e.net_human), 0)
  const taxTotal = employees.reduce((acc, e) => acc + toNum(e.tax_human), 0)
  const totalPayout = netTotal + taxTotal

  // Mock shows ~0.01 USDC fee, keep a gentle estimate
  const executionFee = 0.01

  // Requirements
  const hasBasics = !!sourceChainId && !!defaultTokenAddress && !!title.trim()
  const hasRecipients = recipientsCount > 0
  const payoutPositive = totalPayout > 0
  const scheduleSelected =
    scheduleMode === 'immediate' ? true : scheduleMode === 'scheduled' ? !!startAt : scheduleMode === 'recurring' ? true : false

  const scheduleLabel =
    scheduleMode === 'immediate'
      ? 'Immediate dispatch'
      : scheduleMode === 'scheduled'
      ? 'Scheduled'
      : 'Recurring'

  const steps = useMemo(
    () => [
      { n: 1 as const, title: 'Basics', subtitle: 'Define payroll' },
      { n: 2 as const, title: 'Employees', subtitle: 'Add recipients' },
      { n: 3 as const, title: 'Schedule', subtitle: 'Funding & timing' },
      { n: 4 as const, title: 'Review', subtitle: 'Confirm & create' },
    ],
    []
  )

  function syncScheduleMode(next: ScheduleMode) {
    setScheduleMode(next)

    if (next === 'immediate') {
      setScheduleType('instant')
      setStartAt('')
      setEndAt('')
      return
    }

    if (next === 'scheduled') {
      // one-time but at a future start date
      setScheduleType('instant')
      return
    }

    // recurring
    // default to monthly (you can change later)
    setScheduleType('monthly')
  }

  function handleNext() {
    if (step === 1) {
      if (!sourceChainId) return toast.error('Select settlement network')
      if (!defaultTokenAddress) return toast.error('Select settlement token')
      if (!title.trim()) return toast.error('Enter a payroll name')
    }

    if (step === 2) {
      if (!hasRecipients) return toast.error('Add at least one recipient')
      if (!payoutPositive) return toast.error('Total payout must be greater than 0')
    }

    if (step === 3) {
      if (scheduleMode === 'scheduled' && !startAt) return toast.error('Select a start date')
      // recurring mode: optional details, keep simple for now
    }

    setStep((p) => Math.min(4, (p + 1) as Step))
  }

  function handleBack() {
    setStep((p) => Math.max(1, (p - 1) as Step))
  }

  async function handleSubmit() {
    if (!isWalletConnected || !activeEmployerId) {
      return toast.error('Connect wallet & employer first')
    }

    const startIso =
      scheduleMode === 'immediate'
        ? new Date().toISOString()
        : startAt
        ? new Date(startAt).toISOString()
        : new Date().toISOString()

    const endIso = endAt ? new Date(endAt).toISOString() : null

    const timeSeconds =
      scheduleMode === 'immediate'
        ? null
        : (() => {
            const [h, m] = timeOfDay.split(':').map(Number)
            return h * 3600 + m * 60
          })()

    const day =
      scheduleMode === 'recurring' && (scheduleType === 'monthly' || scheduleType === 'yearly')
        ? Number(dayOfMonth || 1)
        : null

    const payments = employees
      .filter((e) => e.employee_address && (toNum(e.net_human) > 0 || toNum(e.tax_human) > 0))
      .map((e) => ({
        employee_address: e.employee_address,
        token_address: defaultTokenAddress,
        net_human: String(toNum(e.net_human)),
        tax_human: String(toNum(e.tax_human || '0')),
        encrypted_ref: e.encrypted_ref || '0x',
      }))

    if (!payments.length) return toast.error('No valid recipient rows')

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

  // Gates
  if (!isWalletConnected) {
    return (
      <Card className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-10" style={{ background: UI.card, border: `1px solid ${UI.borderSoft}` }}>
        <p className="text-base sm:text-lg" style={{ color: UI.subtext }}>
          Connect your wallet to continue.
        </p>
      </Card>
    )
  }

  if (needsOnboarding || !boundEmployer) {
    return (
      <Card className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-10" style={{ background: UI.card, border: `1px solid ${UI.borderSoft}` }}>
        <p className="text-base sm:text-lg" style={{ color: UI.subtext }}>
          Complete employer onboarding from the Dashboard.
        </p>
      </Card>
    )
  }

  // Dynamic header copy per step (matches mock vibe)
  const headerSubtitle =
    step === 1
      ? 'Define the payroll identity and settlement parameters'
      : step === 2
      ? 'Add recipients and define net plus tax amounts.'
      : step === 3
      ? 'Define when this payroll will run, and review funding requirements.'
      : 'Review and confirm your payroll details before dispatch.'

  return (
    <div className="w-full pt-8 sm:pt-10">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* LEFT STEPPER */}
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

          {/* RIGHT MAIN CARD */}
          <Card
            className="rounded-[18px] overflow-hidden"
            style={{
              background: UI.card,
              border: `1px solid ${UI.borderSoft}`,
              boxShadow: UI.shadow,
            }}
          >
            {/* Header */}
            <div className="px-5 sm:px-7 py-6 sm:py-7" style={{ borderBottom: `1px solid ${UI.borderSoft}` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-[26px] sm:text-[30px] font-semibold" style={{ color: UI.text }}>
                    Create Payroll
                  </h1>
                  <p className="mt-1 text-[13px] sm:text-[14px]" style={{ color: UI.subtext }}>
                    {headerSubtitle}
                  </p>

                  {/* Step 1 shows employer pill like mock */}
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
                        {boundEmployer?.name || 'Employer'}
                      </span>
                    </div>
                  )}

                  {/* Step 2: Add recipient button under subtitle (like mock) */}
                  {step === 2 && (
                    <div className="mt-4">
                      <Button size="sm" className="gap-2 rounded-full h-9 px-5" onClick={addEmployee}>
                        <IconPlus size={18} />
                        Add recipient
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate('/dashboard?tab=payrolls')}
                  className="h-9 px-4 rounded-[10px]"
                >
                  Cancel setup
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 sm:px-7 py-6 sm:py-7">
              {/* =========================
                  STEP 1 (Basics)
                 ========================= */}
              {step === 1 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  {/* LEFT: Settlement */}
                  <div className="rounded-[16px] p-5 sm:p-6" style={{ background: 'rgba(15,23,42,0.02)', border: `1px solid ${UI.borderSoft}` }}>
                    <div className="text-[16px] font-semibold" style={{ color: UI.text }}>
                      Settlement
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium" style={{ color: UI.text }}>
                          Settlement Network
                        </label>
                        <Select
                          value={sourceChainId ? String(sourceChainId) : ''}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSourceChainId(e.target.value ? Number(e.target.value) : '')}
                        >
                          <option value="">Select network</option>
                          {arcChains.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[13px] font-medium" style={{ color: UI.text }}>
                          Settlement Token
                        </label>
                        <Select value={defaultTokenAddress} onChange={(e) => setDefaultTokenAddress(e.target.value)} disabled={!sourceChainId}>
                          <option value="">Select token</option>
                          {filteredTokens.map((t) => (
                            <option key={t.id} value={t.address}>
                              {t.symbol} ({t.address.slice(0, 6)}…{t.address.slice(-4)})
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[13px] font-medium" style={{ color: UI.text }}>
                          Payroll Name
                        </label>
                        <Input className="text-[15px]" placeholder="e.g. January salaries" value={title} onChange={(e) => setTitle(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[13px] font-medium" style={{ color: UI.text }}>
                          Internal Description <span style={{ color: UI.muted }}>(optional)</span>
                        </label>
                        <Input
                          className="text-[15px]"
                          placeholder="Internal note for identifying this payroll"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                        <p className="text-[12px]" style={{ color: UI.muted }}>
                          Internal note for identifying this payroll
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Context + Requirements */}
                  <div className="space-y-4">
                    <div className="rounded-[16px] p-5" style={{ background: UI.card, border: `1px solid ${UI.borderSoft}`, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}>
                      <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                        Payroll Context
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="text-[13px]" style={{ color: UI.subtext }}>
                          <span className="font-semibold" style={{ color: UI.text }}>
                            Employer:
                          </span>{' '}
                          {boundEmployer?.name || '—'}
                        </div>
                        <div className="text-[13px]" style={{ color: UI.subtext }}>
                          <span className="font-semibold" style={{ color: UI.text }}>
                            Settlement Network:
                          </span>{' '}
                          {chain?.name || '—'}
                        </div>
                        <div className="text-[13px]" style={{ color: UI.subtext }}>
                          <span className="font-semibold" style={{ color: UI.text }}>
                            Token:
                          </span>{' '}
                          {token ? `${token.symbol} (${shortAddr(token.address)})` : '—'}
                        </div>
                        <div className="text-[13px]" style={{ color: UI.subtext }}>
                          <span className="font-semibold" style={{ color: UI.text }}>
                            Type:
                          </span>{' '}
                          One-time payroll (default)
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[16px] p-5" style={{ background: UI.card, border: `1px solid ${UI.borderSoft}`, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}>
                      <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                        Requirements
                      </div>

                      <div className="mt-4 space-y-2 text-[13px]" style={{ color: UI.subtext }}>
                        <ReqRow done={hasBasics} label="Payroll basics completed" />
                        <ReqRow done={false} label="Add at least one employee" />
                        <ReqRow done={false} label="Select start date" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================
                  STEP 2 (Recipients)
                 ========================= */}
              {step === 2 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  {/* LEFT */}
                  <div className="space-y-4">
                    <div className="text-[18px] font-semibold" style={{ color: UI.text }}>
                      Recipients
                    </div>

                    {employees.map((r, i) => (
                      <div key={r.index} className="rounded-[16px] p-5 sm:p-6" style={{ border: `1px solid ${UI.borderSoft}`, background: UI.card }}>
                        <div className="flex items-center justify-between">
                          <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                            Recipient {i + 1}
                          </div>

                          {employees.length > 1 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 px-3 rounded-full gap-2"
                              onClick={() => removeEmployee(r.index)}
                            >
                              <IconTrash size={16} />
                              Remove
                            </Button>
                          )}
                        </div>

                        <div className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <label className="text-[13px] font-medium" style={{ color: UI.subtext }}>
                              Wallet address
                            </label>
                            <Input
                              value={r.employee_address}
                              onChange={(e) => updateEmployee(r.index, 'employee_address', e.target.value)}
                              placeholder="0x..."
                              className="font-mono"
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-[13px] font-medium" style={{ color: UI.subtext }}>
                                Net pay
                              </label>
                              <div className="flex overflow-hidden rounded-[12px]" style={{ border: `1px solid ${UI.borderSoft}` }}>
                                <Input
                                  value={r.net_human}
                                  onChange={(e) => updateEmployee(r.index, 'net_human', e.target.value)}
                                  placeholder="1.00"
                                  className="border-0 rounded-none"
                                />
                                <div className="px-3 flex items-center text-[13px] font-semibold" style={{ background: 'rgba(15,23,42,0.02)', color: UI.subtext }}>
                                  {symbol}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[13px] font-medium" style={{ color: UI.subtext }}>
                                Tax <span style={{ color: UI.muted }}>(optional)</span>
                              </label>
                              <div className="flex overflow-hidden rounded-[12px]" style={{ border: `1px solid ${UI.borderSoft}` }}>
                                <Input
                                  value={r.tax_human}
                                  onChange={(e) => updateEmployee(r.index, 'tax_human', e.target.value)}
                                  placeholder="0.00"
                                  className="border-0 rounded-none"
                                />
                                <div className="px-3 flex items-center text-[13px] font-semibold" style={{ background: 'rgba(15,23,42,0.02)', color: UI.subtext }}>
                                  {symbol}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2" style={{ borderTop: `1px solid ${UI.borderSoft}` }}>
                            <div className="flex justify-end">
                              {employees.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 px-4 rounded-full"
                                  onClick={() => removeEmployee(r.index)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-4">
                    <div className="rounded-[16px] p-5" style={{ background: UI.card, border: `1px solid ${UI.borderSoft}`, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}>
                      <div className="text-[16px] font-semibold" style={{ color: UI.text }}>
                        Payroll Summary
                      </div>

                      <div className="mt-4 space-y-2 text-[14px]" style={{ color: UI.subtext }}>
                        <div className="flex justify-between">
                          <span>Recipients:</span>
                          <span style={{ color: UI.text, fontWeight: 600 }}>{recipientsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Net total:</span>
                          <span style={{ color: UI.text, fontWeight: 600 }}>
                            {fmt2(netTotal)} {symbol}
                          </span>
                        </div>
                        <div className="flex justify-between" style={{ borderBottom: `1px solid ${UI.borderSoft}`, paddingBottom: 10 }}>
                          <span>Tax total:</span>
                          <span style={{ color: UI.text, fontWeight: 600 }}>
                            {fmt2(taxTotal)} {symbol}
                          </span>
                        </div>

                        <div className="flex justify-between pt-2">
                          <span style={{ color: UI.text, fontWeight: 700 }}>Total payout:</span>
                          <span style={{ color: UI.text, fontWeight: 800 }}>
                            {fmt2(totalPayout)} {symbol}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[16px] p-5" style={{ background: UI.card, border: `1px solid ${UI.borderSoft}`, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}>
                      <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                        Requirements
                      </div>

                      <div className="mt-4 space-y-2 text-[13px]" style={{ color: UI.subtext }}>
                        <ReqRow done={hasRecipients} label="At least one recipient added" />
                        <ReqRow done={payoutPositive} label="Total payout > 0" />
                        <ReqRow done={false} label="Schedule selected" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================
                  STEP 3 (Schedule)
                 ========================= */}
              {step === 3 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  {/* LEFT */}
                  <div className="space-y-4">
                    <div className="text-[18px] font-semibold" style={{ color: UI.text }}>
                      Execution Schedule
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => syncScheduleMode('immediate')}
                        className="w-full text-left rounded-[14px] p-4"
                        style={{
                          border: `1px solid ${UI.borderSoft}`,
                          background: scheduleMode === 'immediate' ? 'rgba(37,99,235,0.06)' : UI.card,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-1">
                            <IconBolt size={18} style={{ color: scheduleMode === 'immediate' ? '#2563EB' : UI.muted }} />
                          </span>
                          <div>
                            <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                              Immediate dispatch
                            </div>
                            <div className="text-[13px]" style={{ color: UI.subtext }}>
                              Dispatch immediately once payroll is created
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => syncScheduleMode('scheduled')}
                        className="w-full text-left rounded-[14px] p-4"
                        style={{
                          border: `1px solid ${UI.borderSoft}`,
                          background: scheduleMode === 'scheduled' ? 'rgba(37,99,235,0.06)' : UI.card,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-1">
                            <IconCalendar size={18} style={{ color: scheduleMode === 'scheduled' ? '#2563EB' : UI.muted }} />
                          </span>
                          <div>
                            <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                              Scheduled
                            </div>
                            <div className="text-[13px]" style={{ color: UI.subtext }}>
                              Run payroll at a future date
                            </div>

                            {scheduleMode === 'scheduled' && (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-[12px] font-medium" style={{ color: UI.subtext }}>
                                    Start date
                                  </label>
                                  <Input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[12px] font-medium" style={{ color: UI.subtext }}>
                                    Time
                                  </label>
                                  <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => syncScheduleMode('recurring')}
                        className="w-full text-left rounded-[14px] p-4"
                        style={{
                          border: `1px solid ${UI.borderSoft}`,
                          background: scheduleMode === 'recurring' ? 'rgba(37,99,235,0.06)' : UI.card,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-1">
                            <IconRepeat size={18} style={{ color: scheduleMode === 'recurring' ? '#2563EB' : UI.muted }} />
                          </span>
                          <div className="w-full">
                            <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                              Recurring
                            </div>
                            <div className="text-[13px]" style={{ color: UI.subtext }}>
                              Automatically repeat on a fixed cadence
                            </div>

                            {scheduleMode === 'recurring' && (
                              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <div className="space-y-2 sm:col-span-1">
                                  <label className="text-[12px] font-medium" style={{ color: UI.subtext }}>
                                    Cadence
                                  </label>
                                  <Select value={scheduleType} onChange={(e) => setScheduleType(e.target.value as ScheduleType)}>
                                    <option value="daily">Daily</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                  </Select>
                                </div>

                                <div className="space-y-2 sm:col-span-1">
                                  <label className="text-[12px] font-medium" style={{ color: UI.subtext }}>
                                    Time
                                  </label>
                                  <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
                                </div>

                                <div className="space-y-2 sm:col-span-1">
                                  <label className="text-[12px] font-medium" style={{ color: UI.subtext }}>
                                    Day
                                  </label>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={31}
                                    value={dayOfMonth === '' ? '' : String(dayOfMonth)}
                                    onChange={(e) => setDayOfMonth(e.target.value ? Number(e.target.value) : '')}
                                    placeholder="1"
                                    disabled={scheduleType === 'daily'}
                                  />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                  <label className="text-[12px] font-medium" style={{ color: UI.subtext }}>
                                    Start date
                                  </label>
                                  <Input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                                </div>

                                <div className="space-y-2 sm:col-span-1">
                                  <label className="text-[12px] font-medium" style={{ color: UI.subtext }}>
                                    End date (optional)
                                  </label>
                                  <Input type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Helper note bar like mock */}
                      <div
                        className="rounded-[12px] px-4 py-3 text-[13px]"
                        style={{
                          background: 'rgba(37,99,235,0.06)',
                          border: `1px solid rgba(37,99,235,0.10)`,
                          color: UI.subtext,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <IconClock size={16} style={{ color: '#2563EB' }} />
                          {scheduleMode === 'immediate' ? (
                            <span>
                              Payroll will be dispatched <b>immediately</b> after creation.
                            </span>
                          ) : scheduleMode === 'scheduled' ? (
                            <span>
                              Payroll will run on <b>{startAt ? startAt : 'your selected date'}</b>.
                            </span>
                          ) : (
                            <span>Payroll will repeat automatically based on your cadence settings.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Funding & Execution */}
                  <div className="space-y-4">
                    <div className="rounded-[16px] p-5" style={{ background: UI.card, border: `1px solid ${UI.borderSoft}`, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}>
                      <div className="text-[16px] font-semibold" style={{ color: UI.text }}>
                        Funding & Execution
                      </div>

                      <div className="mt-4 space-y-3 text-[14px]" style={{ color: UI.subtext }}>
                        <div className="flex justify-between">
                          <span>Wallet balance:</span>
                          <span style={{ color: UI.text, fontWeight: 700 }}>
                            — {symbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total payout:</span>
                          <span style={{ color: UI.text, fontWeight: 700 }}>
                            {fmt2(totalPayout)} {symbol}
                          </span>
                        </div>
                        <div className="flex justify-between" style={{ borderBottom: `1px solid ${UI.borderSoft}`, paddingBottom: 10 }}>
                          <span>Execution fee:</span>
                          <span style={{ color: UI.text, fontWeight: 700 }}>
                            ~ {fmt2(executionFee)} {symbol}
                          </span>
                        </div>

                        <div className="pt-2 flex items-center justify-center gap-2" style={{ color: '#16A34A', fontWeight: 700 }}>
                          <IconCheck size={18} />
                          Funds sufficient
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================
                  STEP 4 (Review)
                 ========================= */}
              {step === 4 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  {/* LEFT */}
                  <div className="space-y-5">
                    <div className="text-[18px] font-semibold" style={{ color: UI.text }}>
                      Overview
                    </div>

                    <div className="rounded-[16px] p-5" style={{ border: `1px solid ${UI.borderSoft}`, background: UI.card }}>
                      <div className="text-[16px] font-semibold" style={{ color: UI.text }}>
                        {title || 'Untitled payroll'} <span style={{ color: UI.muted, fontWeight: 500 }}>•</span>{' '}
                        <span style={{ color: UI.subtext, fontWeight: 600 }}>{chain?.name || '—'}</span>{' '}
                        <span style={{ color: UI.muted, fontWeight: 500 }}>•</span>{' '}
                        <span style={{ color: UI.subtext, fontWeight: 600 }}>{symbol}</span>
                      </div>

                      <div className="mt-2 text-[14px]" style={{ color: UI.subtext }}>
                        {recipientsCount} recipient{recipientsCount === 1 ? '' : 's'} <span style={{ color: UI.muted }}>•</span>{' '}
                        {scheduleLabel}
                      </div>
                    </div>

                    <div className="text-[18px] font-semibold" style={{ color: UI.text }}>
                      Recipients
                    </div>

                    <div className="rounded-[16px] overflow-hidden" style={{ border: `1px solid ${UI.borderSoft}`, background: UI.card }}>
                      {employees
                        .filter((e) => e.employee_address.trim())
                        .map((e, idx) => {
                          const net = toNum(e.net_human)
                          const tax = toNum(e.tax_human)
                          const tot = net + tax
                          return (
                            <div key={e.index} style={{ borderTop: idx === 0 ? 'none' : `1px solid ${UI.borderSoft}` }}>
                              <div className="px-5 py-4 flex items-center justify-between">
                                <div className="font-mono text-[14px]" style={{ color: UI.text }}>
                                  {shortAddr(e.employee_address)}
                                </div>
                                <div className="text-[14px] font-semibold" style={{ color: UI.text }}>
                                  {fmt2(tot)} {symbol}
                                </div>
                              </div>

                              <div className="px-5 pb-4 text-[14px]" style={{ color: UI.subtext }}>
                                <div className="flex justify-between">
                                  <span>Net pay</span>
                                  <span style={{ color: UI.text, fontWeight: 700 }}>
                                    {fmt2(net)} {symbol}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tax</span>
                                  <span style={{ color: UI.text, fontWeight: 700 }}>
                                    {fmt2(tax)} {symbol}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>

                    <p className="text-[13px] leading-relaxed" style={{ color: UI.subtext }}>
                      You are creating a payroll for {recipientsCount} recipient{recipientsCount === 1 ? '' : 's'} with funds dispatched{' '}
                      {scheduleMode === 'immediate' ? 'immediately' : scheduleMode === 'scheduled' ? 'on the selected date' : 'on a recurring schedule'}, using{' '}
                      <b>
                        {fmt2(totalPayout)} {symbol}
                      </b>{' '}
                      plus a network execution fee of approximately{' '}
                      <b>
                        {fmt2(executionFee)} {symbol}
                      </b>
                      . Make sure everything looks good before proceeding, as this action cannot be undone.
                    </p>
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-4">
                    <div className="rounded-[16px] p-5" style={{ background: UI.card, border: `1px solid ${UI.borderSoft}`, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}>
                      <div className="text-[16px] font-semibold" style={{ color: UI.text }}>
                        Funding & Schedule
                      </div>

                      <div className="mt-4 space-y-3 text-[14px]" style={{ color: UI.subtext }}>
                        <div className="flex justify-between">
                          <span>Wallet balance:</span>
                          <span style={{ color: UI.text, fontWeight: 700 }}>
                            — {symbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total payout:</span>
                          <span style={{ color: UI.text, fontWeight: 700 }}>
                            {fmt2(totalPayout)} {symbol}
                          </span>
                        </div>
                        <div className="flex justify-between" style={{ borderBottom: `1px solid ${UI.borderSoft}`, paddingBottom: 10 }}>
                          <span>Execution fee:</span>
                          <span style={{ color: UI.text, fontWeight: 700 }}>
                            ~ {fmt2(executionFee)} {symbol}
                          </span>
                        </div>

                        <div className="pt-2 flex items-center justify-center gap-2" style={{ color: '#16A34A', fontWeight: 700 }}>
                          <IconCheck size={18} />
                          Funds sufficient
                        </div>

                        <div className="pt-3 text-[12px]" style={{ color: UI.muted }}>
                          Draft will be automatically deleted after creation.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer actions (matches mock: left Back, right Next/Create) */}
              <div className="mt-8 flex items-center justify-between">
                <Button size="md" variant="secondary" className="rounded-full px-8" disabled={step === 1} onClick={handleBack}>
                  Back
                </Button>

                {step < 4 ? (
                  <Button
                    size="md"
                    className="px-10 rounded-full"
                    onClick={handleNext}
                    disabled={
                      (step === 1 && !hasBasics) ||
                      (step === 2 && (!hasRecipients || !payoutPositive)) ||
                      (step === 3 && scheduleMode === 'scheduled' && !startAt)
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    size="md"
                    className="px-10 rounded-full"
                    variant="primary"
                    loading={createPayroll.isPending}
                    onClick={handleSubmit}
                    disabled={!hasBasics || !hasRecipients || !payoutPositive || !scheduleSelected}
                  >
                    Create payroll
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
