import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { UI } from '../ui'
import { fmt2 } from '../utils'
import type { EmployeeRow } from '../types'
import { ReqRow } from './ReqRow'
import { IconTrash, IconUsers, IconClipboardList, IconShieldCheck } from '@tabler/icons-react'

export function Step2Recipients({
  employees,
  symbol,
  onRemove,
  onUpdate,
  recipientsCount,
  netTotal,
  taxTotal,
  totalPayout,
  hasRecipients,
  payoutPositive,
}: {
  employees: EmployeeRow[]
  symbol: string
  onRemove: (index: number) => void
  onUpdate: (
    index: number,
    field: 'employee_address' | 'net_human' | 'tax_human' | 'encrypted_ref' | 'token_address',
    value: string
  ) => void
  recipientsCount: number
  netTotal: number
  taxTotal: number
  totalPayout: number
  hasRecipients: boolean
  payoutPositive: boolean
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* LEFT */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[18px] font-semibold" style={{ color: UI.text }}>
          <IconUsers size={20} style={{ color: UI.navy }} />
          Recipients
        </div>

        {employees.map((r, i) => (
          <div
            key={r.index}
            className="rounded-[16px] p-5 sm:p-6"
            style={{ border: `1px solid ${UI.borderSoft}`, background: UI.card }}
          >
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
                Recipient {i + 1}
              </div>

              {employees.length > 1 && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 px-3 rounded-full gap-2"
                  onClick={() => onRemove(r.index)}
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
                  onChange={(e) => onUpdate(r.index, 'employee_address', e.target.value)}
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
                      onChange={(e) => onUpdate(r.index, 'net_human', e.target.value)}
                      placeholder="1.00"
                      className="border-0 rounded-none"
                    />
                    <div
                      className="px-3 flex items-center text-[13px] font-semibold"
                      style={{ background: 'rgba(15,23,42,0.02)', color: UI.subtext }}
                    >
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
                      onChange={(e) => onUpdate(r.index, 'tax_human', e.target.value)}
                      placeholder="0.00"
                      className="border-0 rounded-none"
                    />
                    <div
                      className="px-3 flex items-center text-[13px] font-semibold"
                      style={{ background: 'rgba(15,23,42,0.02)', color: UI.subtext }}
                    >
                      {symbol}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2" style={{ borderTop: `1px solid ${UI.borderSoft}` }}>
                <div className="flex justify-end">
                  {employees.length > 1 && (
                    <Button size="sm" variant="secondary" className="h-8 px-4 rounded-full" onClick={() => onRemove(r.index)}>
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
        <div
          className="rounded-[16px] p-5"
          style={{ background: UI.card, border: `1px solid ${UI.borderSoft}`, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}
        >
          <div className="flex items-center gap-2 text-[16px] font-semibold" style={{ color: UI.text }}>
            <IconClipboardList size={18} style={{ color: UI.navy }} />
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

        <div
          className="rounded-[16px] p-5"
          style={{ background: UI.card, border: `1px solid ${UI.borderSoft}`, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}
        >
          <div className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: UI.text }}>
            <IconShieldCheck size={18} style={{ color: UI.navy }} />
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
  )
}
