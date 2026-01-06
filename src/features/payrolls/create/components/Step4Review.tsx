import { UI } from '../ui'
import { fmt2, toNum, shortAddr } from '../utils'
import type { EmployeeRow, ScheduleMode } from '../types'
import type { ChainDTO, TokenDTO } from '../../../../api/chains'
import { IconCheck, IconClipboardCheck, IconUsers, IconWallet } from '@tabler/icons-react'

export function Step4Review({
  title,
  chain,
  token,
  employees,
  scheduleMode,
  scheduleLabel,
  recipientsCount,
  totalPayout,
  executionFee,

  // ✅ wallet
  walletTokenBalance,
  walletLoading,
  walletCanQuery,
  walletError,
}: {
  title: string
  chain?: ChainDTO
  token?: TokenDTO
  employees: EmployeeRow[]
  scheduleMode: ScheduleMode
  scheduleLabel: string
  recipientsCount: number
  totalPayout: number
  executionFee: number

  // ✅ wallet
  walletTokenBalance: number | null
  walletLoading: boolean
  walletCanQuery: boolean
  walletError: string | null
}) {
  const symbol = token?.symbol || 'USDC'

  const required = totalPayout + executionFee

  const fundsSufficient = walletTokenBalance !== null && walletTokenBalance >= required

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
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-[18px] font-semibold" style={{ color: UI.navy }}>
          <IconClipboardCheck size={20} style={{ color: UI.navy }} />
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

        <div className="flex items-center gap-2 text-[18px] font-semibold" style={{ color: UI.navy }}>
          <IconUsers size={20} style={{ color: UI.navy }} />
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
                <div
                  key={e.index}
                  style={{
                    borderTop: idx === 0 ? 'none' : `1px solid ${UI.borderSoft}`,
                  }}
                >
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

        <p
  className="text-[12.5px] leading-relaxed"
  style={{ color: UI.muted }}
>
          You are creating a payroll for {recipientsCount} recipient{recipientsCount === 1 ? '' : 's'} with funds dispatched{' '}
          {scheduleMode === 'immediate'
            ? 'immediately'
            : scheduleMode === 'scheduled'
              ? 'on the selected date'
              : 'on a recurring schedule'}
          , using{' '}
          <b>
            {fmt2(totalPayout)} {symbol}
          </b>{' '}
          plus a network execution fee of approximately{' '}
          <b>
            {fmt2(executionFee)} {symbol}
          </b>
          . Make sure everything looks good before proceeding.
        </p>
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
          <div className="flex items-center gap-2 text-[16px] font-semibold" style={{ color: UI.navy }}>
            <IconWallet size={18} style={{ color: UI.navy }} />
            Funding & Schedule
          </div>

          <div className="mt-4 space-y-3 text-[14px]" style={{ color: UI.subtext }}>
            <div className="flex justify-between">
              <span>Wallet balance:</span>
              <span style={{ color: UI.text, fontWeight: 700 }}>
                {walletLoading
                  ? 'Loading…'
                  : walletError
                    ? `— ${symbol}`
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

            <div
  className="flex justify-between"
  style={{ borderBottom: `1px solid ${UI.borderSoft}`, paddingBottom: 10 }}
>
  <span style={{ color: UI.text, fontWeight: 800 }}>Required:</span>
  <span style={{ color: UI.text, fontWeight: 700 }}>
    {fmt2(required)} {symbol}
  </span>
</div>

            <div
  className="pt-2 flex items-center justify-center gap-2"
  style={{ color: statusColor, fontWeight: 700 }}
>
  {fundsSufficient ? (
    <IconCheck size={18} />
  ) : (
    <IconWallet size={18} />
  )}
  {statusText}
</div>

            {walletError && walletCanQuery && !walletLoading && (
              <div className="pt-2 text-[12px]" style={{ color: '#DC2626' }}>
                {walletError}
              </div>
            )}

            <div className="pt-3 text-[12px]" style={{ color: UI.muted }}>
              Draft will be automatically deleted after creation.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
