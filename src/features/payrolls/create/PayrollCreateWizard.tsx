import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useChains, useTokens, filterTokensByChain } from '../../../hooks/useChains'
import { useWalletEmployerBinding } from '../../../hooks/useWalletEmployerBinding'
import { useCreatePayroll } from '../../../hooks/hooks/usePayrolls'

import type { ChainDTO, TokenDTO } from '../../../api/chains'
import type { PaymentPayload } from '../../../api/payrolls'

import { useAccount, useBalance } from 'wagmi'

import { UI } from './ui'
import { toNum } from './utils'
import type { Step, EmployeeRow, ScheduleMode, ScheduleType } from './types'
import { isAddress } from 'viem'

import { WizardStepper } from './components/WizardStepper'
import { WizardShell } from './components/WizardShell'
import { StepHeader } from './components/StepHeader'
import { StepFooter } from './components/StepFooter'
import { Step1Basics } from './components/Step1Basics'
import { Step2Recipients } from './components/Step2Recipients'
import { Step3Schedule } from './components/Step3Schedule'
import { Step4Review } from './components/Step4Review'

function normalizeAddr(addr: string) {
  return addr.trim().toLowerCase()
}

export function PayrollCreateWizard() {
  const navigate = useNavigate()
  const { data: chains } = useChains()
  const { data: tokens } = useTokens()

  const { activeEmployerId, needsOnboarding, isWalletConnected, boundEmployer } =
    useWalletEmployerBinding()
  const createPayroll = useCreatePayroll()

  const { address } = useAccount()

  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [sourceChainId, setSourceChainId] = useState<number | ''>('')
  const [defaultTokenAddress, setDefaultTokenAddress] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Step 2
  const [employees, setEmployees] = useState<EmployeeRow[]>([
    { index: 0, employee_address: '', token_address: '', net_human: '', tax_human: '', encrypted_ref: '0x' },
  ])

  // Step 3
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('immediate')
  const [scheduleType, setScheduleType] = useState<ScheduleType>('instant')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('09:00')
  const [dayOfMonth, setDayOfMonth] = useState<number | ''>('')

  // Chains/tokens
  const arcChains = (chains || []).filter((c: ChainDTO) => c.name.toLowerCase().includes('arc'))
  const filteredTokens = filterTokensByChain(
    tokens,
    typeof sourceChainId === 'number' ? sourceChainId : undefined
  )

  const chain = useMemo(() => {
    if (!sourceChainId) return undefined
    return arcChains.find((c: ChainDTO) => c.id === sourceChainId)
  }, [arcChains, sourceChainId])

  const token = useMemo(() => {
    if (!defaultTokenAddress) return undefined
    return (filteredTokens || []).find(
      (t: TokenDTO) => t.address.toLowerCase() === defaultTokenAddress.toLowerCase()
    )
  }, [filteredTokens, defaultTokenAddress])

  const symbol = token?.symbol || 'USDC'

  // Wallet balances
  // ✅ FIX: wagmi expects EVM chainId, NOT your DB primary key.
  // sourceChainId = ChainDTO.id (DB id), chain.chain_id = EVM chainId.
  const activeChainId = chain?.chain_id
  const tokenAddr = defaultTokenAddress ? (defaultTokenAddress as `0x${string}`) : undefined

  // ✅ This tells the UI whether user has actually selected what we need
  const walletCanQuery = Boolean(address && tokenAddr && activeChainId)

  const tokenBalance = useBalance({
    address,
    token: tokenAddr,
    chainId: activeChainId,
    query: {
      enabled: walletCanQuery,
      refetchInterval: 12_000,
    },
  })

  const walletTokenBalance = useMemo(() => {
    const v = tokenBalance.data?.formatted
    if (!v) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }, [tokenBalance.data?.formatted])

  // ✅ If wagmi fails (missing chain in config, bad RPC, wrong token), surface it
  const walletError = tokenBalance.isError ? 'Balance fetch failed (check chain config / token / RPC)' : null

  // Employees ops
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
  function handleCsvImport(rows: Array<{ wallet: string; net?: string; tax?: string }>) {
  setEmployees((prev) => [
    ...prev,
    ...rows.map((r, i) => ({
      index: prev.length + i,
      employee_address: r.wallet,
      token_address: '',
      net_human: r.net || '',
      tax_human: r.tax || '',
      encrypted_ref: '0x',
    })),
  ])
}

  function removeEmployee(index: number) {
    setEmployees((prev) => prev.filter((row) => row.index !== index))
  }

  function updateEmployee(index: number, field: keyof PaymentPayload, value: string) {
    setEmployees((prev) =>
      prev.map((row) => (row.index === index ? { ...row, [field]: value } : row))
    )
  }
  
  const executionFee = 0.01
  // Totals/requirements
  const recipientsCount = employees.filter((e) => e.employee_address.trim()).length
 

  const netTotal = employees.reduce((acc, e) => acc + toNum(e.net_human), 0)
  const taxTotal = employees.reduce((acc, e) => acc + toNum(e.tax_human), 0)
  const totalPayout = netTotal + taxTotal

  function computeOccurrences() {
  if (scheduleMode !== 'recurring') return 1
  if (!startAt || !endAt) return 0

  const start = new Date(startAt)
  const end = new Date(endAt)

  if (scheduleType === 'daily') {
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(diff, 1)
  }

  if (scheduleType === 'monthly') {
    return (
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1
    )
  }

  if (scheduleType === 'yearly') {
    return end.getFullYear() - start.getFullYear() + 1
  }

  return 1
}

const occurrences = computeOccurrences()

const requiredFunding =
  occurrences * totalPayout + executionFee


const walletHasFunds =
  walletTokenBalance !== null &&
  walletTokenBalance >= requiredFunding


  const hasBasics = !!sourceChainId && !!defaultTokenAddress && !!title.trim()
  const hasRecipients = recipientsCount > 0
  const payoutPositive = totalPayout > 0

 const scheduleSelected =
  scheduleMode === 'immediate'
    ? true
    : scheduleMode === 'scheduled'
      ? !!startAt
      : scheduleMode === 'recurring'
        ? !!startAt && !!endAt
        : false


  const scheduleLabel =
    scheduleMode === 'immediate' ? 'Immediate dispatch' : scheduleMode === 'scheduled' ? 'Scheduled' : 'Recurring'

  const steps = useMemo(
    () => [
      { n: 1 as const, title: 'Basics', subtitle: 'Define payroll' },
      { n: 2 as const, title: 'Employees', subtitle: 'Add recipients' },
      { n: 3 as const, title: 'Schedule', subtitle: 'Funding & timing' },
      { n: 4 as const, title: 'Review', subtitle: 'Confirm & create' },
    ],
    []
  )

 function setMode(next: ScheduleMode) {
  setScheduleMode(next)

  if (next === 'immediate') {
    setScheduleType('instant')
    setStartAt('')
    setEndAt('')
    return
  }

  if (next === 'scheduled') {
    setScheduleType('instant')
    return
  }

  // ✅ only set default ON FIRST ENTRY to recurring
  if (scheduleMode !== 'recurring') {
    setScheduleType('monthly')
  }
}

  function subtitleForStep(s: Step) {
    if (s === 1) return 'Define the payroll identity and settlement parameters'
    if (s === 2) return 'Add recipients and define net plus tax amounts.'
    if (s === 3) return 'Define when this payroll will run, and review funding requirements.'
    return 'Review and confirm your payroll details before dispatch.'
  }
  const addressCounts = useMemo(() => {
  const map: Record<string, number> = {}

  employees.forEach((e) => {
    if (!e.employee_address) return
    const key = normalizeAddr(e.employee_address)
    map[key] = (map[key] || 0) + 1
  })

  return map
}, [employees])

const hasDuplicateWallets = Object.values(addressCounts).some(
  (count) => count > 1
)

const hasInvalidWallets = employees.some(
  (e) =>
    e.employee_address &&
    !isAddress(e.employee_address)
)

  function handleNext() {
    if (step === 1) {
      if (!sourceChainId) return toast.error('Select settlement network')
      if (!defaultTokenAddress) return toast.error('Select settlement token')
      if (!title.trim()) return toast.error('Enter a payroll name')
    }

    if (step === 2) {
  if (!hasRecipients) {
    return toast.error('Add at least one recipient')
  }

  if (hasInvalidWallets) {
    return toast.error('One or more wallet addresses are invalid')
  }

  if (hasDuplicateWallets) {
    return toast.error('Duplicate wallet addresses detected')
  }

  if (!payoutPositive) {
    return toast.error('Total payout must be greater than 0')
  }
}

    if (step === 3) {
  if (scheduleMode === 'scheduled' && !startAt) {
    return toast.error('Select a start date')
  }

  if (scheduleMode === 'recurring') {
    if (!startAt || !endAt) {
      return toast.error('Recurring payroll requires start and end dates')
    }

    if (new Date(endAt) < new Date(startAt)) {
      return toast.error('End date cannot be earlier than start date')
    }
  }
}

    setStep((p) => Math.min(4, (p + 1) as Step))
  }

  function handleBack() {
    setStep((p) => Math.max(1, (p - 1) as Step))
  }

  async function handleSubmit() {
    if (!isWalletConnected || !activeEmployerId) return toast.error('Connect wallet & employer first')
    if (!walletHasFunds) {
  return toast.error('Insufficient wallet balance to fund this payroll')
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
  scheduleMode === 'recurring' && scheduleType === 'monthly'
    ? Number(dayOfMonth || 1)
    : null


    const schedule =
    scheduleMode === 'immediate' || scheduleMode === 'scheduled'
      ? {
          type: 'instant',
          start_at: startIso,
        }
      : {
          type: scheduleType,
          start_at: startIso,
          end_at: endIso,
          time_of_day_seconds: timeSeconds,
          day_of_month: scheduleType === 'monthly' ? day : null,
        }


    const merged: Record<string, PaymentPayload> = {}

employees.forEach((e) => {
  if (!e.employee_address) return
  const key = normalizeAddr(e.employee_address)

  if (!merged[key]) {
    merged[key] = {
      employee_address: e.employee_address,
      token_address: defaultTokenAddress,
      net_human: '0',
      tax_human: '0',
      encrypted_ref: e.encrypted_ref || '0x',
    }
  }

  merged[key].net_human = String(
    toNum(merged[key].net_human) + toNum(e.net_human)
  )
  merged[key].tax_human = String(
    toNum(merged[key].tax_human) + toNum(e.tax_human)
  )
})

const payments = Object.values(merged)

    if (!payments.length) return toast.error('No valid recipient rows')

    try {
      const payload = {
          employer: activeEmployerId,
          source_chain: sourceChainId as number,
          title: title.trim(),
          description: description.trim(),
          default_token_address: defaultTokenAddress,
          schedule, // ← USE IT HERE
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

  // Guards
  if (!isWalletConnected) {
    return (
      <div className="w-full pt-8 sm:pt-10 px-4">
        <div className="mx-auto max-w-xl">
          <div
            className="rounded-[16px] p-6"
            style={{ background: UI.card, border: `1px solid ${UI.borderSoft}` }}
          >
            <p style={{ color: UI.subtext }}>Connect your wallet to continue.</p>
          </div>
        </div>
      </div>
    )
  }

  if (needsOnboarding || !boundEmployer) {
    return (
      <div className="w-full pt-8 sm:pt-10 px-4">
        <div className="mx-auto max-w-xl">
          <div
            className="rounded-[16px] p-6"
            style={{ background: UI.card, border: `1px solid ${UI.borderSoft}` }}
          >
            <p style={{ color: UI.subtext }}>Complete employer onboarding from the Dashboard.</p>
          </div>
        </div>
      </div>
    )
  }

  const employerName = boundEmployer?.name || 'Employer'

 const nextDisabled =
  (step === 1 && !hasBasics) ||
  (step === 2 &&
    (!hasRecipients ||
      !payoutPositive ||
      hasDuplicateWallets ||
      hasInvalidWallets)) ||
  (step === 3 && scheduleMode === 'scheduled' && !startAt)
  



  const submitDisabled =
  !hasBasics ||
  !hasRecipients ||
  !payoutPositive ||
  !scheduleSelected ||
  !walletHasFunds

  return (
    // ✅ FIX: add bottom padding so content never kisses the global footer
    <div className="w-full pt-8 sm:pt-10 pb-10 sm:pb-14">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <WizardStepper step={step} steps={steps} />

          <WizardShell>
            <StepHeader
              step={step}
              subtitle={subtitleForStep(step)}
              employerName={employerName}
              onCancel={() => navigate('/dashboard?tab=payrolls')}
              onAddRecipient={step === 2 ? addEmployee : undefined}
            />

            <div className="px-5 sm:px-7 py-6 sm:py-7">
              {step === 1 && (
                <Step1Basics
                  arcChains={arcChains}
                  filteredTokens={filteredTokens}
                  sourceChainId={sourceChainId}
                  defaultTokenAddress={defaultTokenAddress}
                  title={title}
                  description={description}
                  setSourceChainId={setSourceChainId}
                  setDefaultTokenAddress={setDefaultTokenAddress}
                  setTitle={setTitle}
                  setDescription={setDescription}
                  employerName={employerName}
                  chain={chain}
                  token={token}
                  hasBasics={hasBasics}
                />
              )}

              {step === 2 && (
                <Step2Recipients
                  employees={employees}
                  symbol={symbol}
                  onRemove={removeEmployee}
                  onUpdate={updateEmployee}
                  onAdd={addEmployee}
                  onCsvImport={handleCsvImport}
                  recipientsCount={recipientsCount}
                  netTotal={netTotal}
                  taxTotal={taxTotal}
                  totalPayout={totalPayout}
                  hasRecipients={hasRecipients}
                  payoutPositive={payoutPositive}
                />
              )}

              {step === 3 && (
                <Step3Schedule
                  scheduleMode={scheduleMode}
                  scheduleType={scheduleType}
                  startAt={startAt}
                  endAt={endAt}
                  timeOfDay={timeOfDay}
                  dayOfMonth={dayOfMonth}
                  onSetMode={setMode}
                  setScheduleType={setScheduleType}
                  setStartAt={setStartAt}
                  setEndAt={setEndAt}
                  setTimeOfDay={setTimeOfDay}
                  setDayOfMonth={setDayOfMonth}
                  symbol={symbol}
                  totalPayout={totalPayout}
                  executionFee={executionFee}
                  requiredFunding={requiredFunding}  
                  walletTokenBalance={walletTokenBalance}
                  walletLoading={tokenBalance.isLoading}
                  walletCanQuery={walletCanQuery}
                  walletError={walletError}
                />
              )}

              {step === 4 && (
                <Step4Review
                  title={title}
                  chain={chain}
                  token={token}
                  employees={employees}
                  scheduleMode={scheduleMode}
                  scheduleLabel={scheduleLabel}
                  recipientsCount={recipientsCount}
                  totalPayout={totalPayout}
                  executionFee={executionFee}
                  walletTokenBalance={walletTokenBalance}
                  walletLoading={tokenBalance.isLoading}
                  walletCanQuery={walletCanQuery}
                  walletError={walletError}
                />
              )}

              <StepFooter
                step={step}
                backDisabled={step === 1}
                nextDisabled={nextDisabled}
                submitDisabled={submitDisabled}
                submitting={createPayroll.isPending}
                onBack={handleBack}
                onNext={handleNext}
                onSubmit={handleSubmit}
              />
            </div>
          </WizardShell>
        </div>
      </div>
    </div>
  )
}
