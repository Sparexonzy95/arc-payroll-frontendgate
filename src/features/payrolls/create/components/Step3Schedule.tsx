import { UI } from '../ui'
import { Input } from '../../../../components/ui/Input'
import { Select } from '../../../../components/ui/Select'
import type { ScheduleMode, ScheduleType } from '../types'
import { fmt2 } from '../utils'
import {
  IconBolt,
  IconCalendar,
  IconRepeat,
  IconClock,
  IconCheck,
  IconWallet,
} from '@tabler/icons-react'

export function Step3Schedule({
  scheduleMode,
  scheduleType,
  startAt,
  endAt,
  timeOfDay,
  dayOfMonth,
  onSetMode,
  setScheduleType,
  setStartAt,
  setEndAt,
  setTimeOfDay,
  setDayOfMonth,
  symbol,
  totalPayout,
  executionFee,
  requiredFunding,

  // ✅ wallet (from PayrollCreateWizard)
  walletTokenBalance,
  walletLoading,
  walletCanQuery,
  walletError,
}: {
  scheduleMode: ScheduleMode
  scheduleType: ScheduleType
  startAt: string
  endAt: string
  timeOfDay: string
  dayOfMonth: number | ''
  onSetMode: (m: ScheduleMode) => void
  setScheduleType: (t: ScheduleType) => void
  setStartAt: (v: string) => void
  setEndAt: (v: string) => void
  setTimeOfDay: (v: string) => void
  setDayOfMonth: (v: number | '') => void
  symbol: string
  totalPayout: number
  executionFee: number
  requiredFunding: number

  // ✅ wallet
  walletTokenBalance: number | null
  walletLoading: boolean
  walletCanQuery: boolean
  walletError: string | null
}) {
  
  
  const fundsSufficient =
    walletTokenBalance !== null && walletTokenBalance >= requiredFunding

  const statusText = walletLoading
    ? 'Checking balance…'
    : !walletCanQuery
      ? 'Select network + token'
      : walletError
        ? 'Balance fetch failed'
        : walletTokenBalance === null
          ? 'Balance unavailable'
          : fundsSufficient
            ? 'Funds sufficient'
            : 'Insufficient funds'

  const statusColor = walletLoading
    ? UI.subtext
    : !walletCanQuery
      ? UI.subtext
      : walletError
        ? '#DC2626'
        : walletTokenBalance === null
          ? UI.subtext
          : fundsSufficient
            ? '#16A34A'
            : '#DC2626'

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* LEFT */}
      <div className="space-y-4">
        <div className="text-[18px] font-semibold" style={{ color: UI.text }}>
          Execution Schedule
        </div>

        <div className="space-y-3">
          {/* Immediate */}
          <button
            type="button"
            onClick={() => onSetMode('immediate')}
            className="w-full text-left rounded-[14px] p-4"
            style={{
              border: `1px solid ${UI.borderSoft}`,
              background:
                scheduleMode === 'immediate'
                  ? 'rgba(37,99,235,0.06)'
                  : UI.card,
            }}
          >
            <div className="flex items-start gap-3">
              <IconBolt
                size={18}
                style={{
                  color:
                    scheduleMode === 'immediate'
                      ? '#2563EB'
                      : UI.muted,
                }}
              />
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

          {/* Scheduled */}
          <button
            type="button"
            onClick={() => onSetMode('scheduled')}
            className="w-full text-left rounded-[14px] p-4"
            style={{
              border: `1px solid ${UI.borderSoft}`,
              background:
                scheduleMode === 'scheduled'
                  ? 'rgba(37,99,235,0.06)'
                  : UI.card,
            }}
          >
            <div className="flex items-start gap-3">
              <IconCalendar
                size={18}
                style={{
                  color:
                    scheduleMode === 'scheduled'
                      ? '#2563EB'
                      : UI.muted,
                }}
              />
              <div className="w-full">
                <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                  Scheduled
                </div>
                <div className="text-[13px]" style={{ color: UI.subtext }}>
                  Run payroll at a future date
                </div>

                {scheduleMode === 'scheduled' && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[12px]" style={{ color: UI.subtext }}>
                        Start date
                      </label>
                      <Input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px]" style={{ color: UI.subtext }}>
                        Time
                      </label>
                      <Input type="time" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Recurring */}
        <div
  className="w-full text-left rounded-[14px] p-4"
  style={{
    border: `1px solid ${UI.borderSoft}`,
    background:
      scheduleMode === 'recurring'
        ? 'rgba(37,99,235,0.06)'
        : UI.card,
  }}
>
            <div
  className="flex items-start gap-3 cursor-pointer"
  onClick={() => onSetMode('recurring')}
>
  <IconRepeat
    size={18}
    style={{
      color:
        scheduleMode === 'recurring'
          ? '#2563EB'
          : UI.muted,
    }}
  />
  <div className="w-full">
                <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                  Recurring
                </div>
                <div className="text-[13px]" style={{ color: UI.subtext }}>
                  Automatically repeat on a fixed cadence
                </div>

                {scheduleMode === 'recurring' && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
  {/* Start date */}
  <div className="space-y-2">
    <label className="text-[12px]" style={{ color: UI.subtext }}>
      Start date
    </label>
    <Input
      type="date"
      value={startAt}
      onChange={(e) => setStartAt(e.target.value)}
    />
  </div>

  {/* End date */}
  <div className="space-y-2">
    <label className="text-[12px]" style={{ color: UI.subtext }}>
      End date
    </label>
    <Input
      type="date"
      value={endAt}
      onChange={(e) => setEndAt(e.target.value)}
    />
  </div>

  {/* Cadence */}
  <div className="space-y-2">
    <label className="text-[12px]" style={{ color: UI.subtext }}>
      Cadence
    </label>
    <Select
      value={scheduleType}
      onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
    >
      <option value="daily">Daily</option>
      <option value="monthly">Monthly</option>
      <option value="yearly">Yearly</option>
    </Select>
  </div>

  {/* Time */}
  <div className="space-y-2">
    <label className="text-[12px]" style={{ color: UI.subtext }}>
      Time
    </label>
    <Input
      type="time"
      value={timeOfDay}
      onChange={(e) => setTimeOfDay(e.target.value)}
    />
  </div>

  {/* Day (MONTHLY ONLY) */}
  <div className="space-y-2">
    <label className="text-[12px]" style={{ color: UI.subtext }}>
      Day
    </label>
    <Input
      type="number"
      min={1}
      max={31}
      value={dayOfMonth === '' ? '' : String(dayOfMonth)}
      onChange={(e) => setDayOfMonth(e.target.value ? Number(e.target.value) : '')}
      disabled={scheduleType !== 'monthly'}
    />
  </div>
</div>

                )}
              </div>
            </div>
          </div>

          {/* Info */}
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
              {scheduleMode === 'immediate'
                ? 'Payroll will be dispatched immediately.'
                : scheduleMode === 'scheduled'
                  ? `Payroll will run on ${startAt || 'your selected date'}.`
                  : 'Payroll will repeat automatically based on cadence.'}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="space-y-4">
        <div
          className="rounded-[16px] p-5"
          style={{
            background: UI.card,
            border: `1px solid ${UI.borderSoft}`,
            boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)',
          }}
        >
          <div className="flex items-center gap-2 text-[16px] font-semibold" style={{ color: UI.text }}>
            <IconWallet size={18} style={{ color: UI.navy }} />
            Funding & Execution
          </div>

          <div className="mt-4 space-y-3 text-[14px]" style={{ color: UI.subtext }}>
            <div className="flex justify-between">
              <span>Wallet balance:</span>
              <span style={{ color: UI.text, fontWeight: 700 }}>
                {walletLoading
                  ? 'Loading…'
                  : walletTokenBalance === null
                    ? `— ${symbol}`
                    : `${fmt2(walletTokenBalance)} ${symbol}`}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Total payout:</span>
              <span style={{ color: UI.text, fontWeight: 700 }}>
                {fmt2(totalPayout)} {symbol}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Execution fee:</span>
              <span style={{ color: UI.text, fontWeight: 700 }}>
                ~ {fmt2(executionFee)} {symbol}
              </span>
            </div>

            <div className="flex justify-between" style={{ borderBottom: `1px solid ${UI.borderSoft}`, paddingBottom: 10 }}>
              <span>Required:</span>
              <span style={{ color: UI.text, fontWeight: 700 }}>
               {fmt2(requiredFunding)} {symbol}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2" style={{ color: statusColor, fontWeight: 700 }}>
              <IconCheck size={18} />
              {statusText}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
