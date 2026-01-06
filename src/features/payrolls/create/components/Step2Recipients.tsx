import { Button } from '../../../../components/ui/Button'
import { Input } from '../../../../components/ui/Input'
import { UI } from '../ui'
import { fmt2 } from '../utils'
import type { EmployeeRow } from '../types'
import { ReqRow } from './ReqRow'
import { isAddress } from 'viem'
import { IconTrash, IconUsers, IconClipboardList, IconShieldCheck } from '@tabler/icons-react'
import { motion } from 'framer-motion'

function normalizeAddr(v: string) {
  return v.trim().toLowerCase()
}


export function Step2Recipients({
  employees,
  symbol,
  onRemove,
  onUpdate,
  onAdd,
  onCsvImport,
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
  onAdd: () => void
  onCsvImport: (
    rows: Array<{ wallet: string; net?: string; tax?: string }>
  ) => void 
  recipientsCount: number
  netTotal: number
  taxTotal: number
  totalPayout: number
  hasRecipients: boolean
  payoutPositive: boolean
}) {
  const addressCounts = employees.reduce<Record<string, number>>((acc, e) => {
  if (!e.employee_address) return acc
  const key = normalizeAddr(e.employee_address)
  acc[key] = (acc[key] || 0) + 1
  return acc
}, {})


  return (
    
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <input
  id="csv-upload"
  type="file"
  accept=".csv"
  hidden
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const lines = text.split('\n').slice(1)

      const rows = lines
        .map((l) => {
          const [wallet, net, tax] = l.split(',').map((v) => v?.trim())
          if (!wallet) return null
          return { wallet, net, tax }
        })
        .filter(Boolean) as Array<{ wallet: string; net?: string; tax?: string }>

      onCsvImport(rows) // ✅ EMIT ONLY
    }

    reader.readAsText(file)
  }}
/>
      {/* LEFT */}
      <div className="space-y-4">
       <div className="flex items-center justify-between">
  <div className="flex items-center gap-2 text-[18px] font-semibold" style={{ color: '#0c2b51' }}>
    <IconUsers size={20} />
    Recipients
  </div>
  <Button
  size="sm"
  className="h-8 px-4 rounded-full mt-2"
  style={{
    background: 'transparent',
    border: '1px dashed rgba(12,43,81,0.35)',
    color: '#0c2b51',
  }}
  onClick={() => document.getElementById('csv-upload')?.click()}
>
  Import CSV
</Button>

  <Button
    size="sm"
    className="h-8 px-4 rounded-full"
    style={{
      background: 'transparent',
      border: '1px solid rgba(12,43,81,0.35)',
      color: '#0c2b51',
    }}
     onClick={onAdd} 
  >
    + Add recipient
  </Button>
</div>


        {employees.map((r, i) => (
          <div
            key={r.index}
            className="rounded-[16px] p-5 sm:p-6"
            style={{ border: `1px solid ${UI.borderSoft}`, background: UI.card }}
          >
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold" style={{ color: '#0c2b51' }}>
                Recipient {i + 1}
              </div>

              {employees.length > 1 && (
               <Button
  size="sm"
  className="h-8 px-3 rounded-full gap-2"
  style={{
    background: 'transparent',
    border: '1px solid rgba(12,43,81,0.35)',
    color: '#0c2b51',
  }}
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
  placeholder="0x..."
  className="font-mono"
  onChange={(e) => {
    const value = e.target.value

    // Multi-paste detection (delegate to Wizard)
    if (value.includes('\n') || value.includes(',')) {
      const rows = value
        .split(/[\n,]+/)
        .map((v) => v.trim())
        .filter(Boolean)
        .map((wallet) => ({ wallet }))

      if (rows.length > 1) {
        onCsvImport(rows) // ✅ EMIT ONLY
        return
      }
    }

    onUpdate(r.index, 'employee_address', value)
  }}
/>

{r.employee_address &&
  addressCounts[normalizeAddr(r.employee_address)] > 1 && (
    <p
      className="text-[12px] mt-1"
      style={{ color: '#DC2626', fontWeight: 600 }}
    >
      Duplicate wallet detected
    </p>
    
)}
{r.employee_address &&
  !isAddress(r.employee_address) && (
    <p
      className="text-[12px] mt-1"
      style={{ color: '#DC2626', fontWeight: 600 }}
    >
      Invalid wallet address
    </p>
)}

                {r.employee_address && r.employee_address.length > 0 && (
  <p
    className="text-[12px] mt-1"
    style={{
      color:
        r.employee_address.length === 42
          ? '#16A34A'
          : UI.muted,
    }}
  >
    {r.employee_address.length === 42
      ? 'Valid address length'
      : 'Ethereum addresses are 42 characters long'}
  </p>
)}

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
                   <Button
  size="sm"
  className="h-8 px-3 rounded-full gap-2"
  style={{
    background: 'transparent',
    border: '1px solid rgba(12,43,81,0.35)',
    color: '#0c2b51',
  }}
  onClick={() => onRemove(r.index)}
>
  <IconTrash size={16} />
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
          <div className="flex items-center gap-2 text-[16px] font-semibold" style={{ color: '#0c2b51' }}>
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
           <motion.span
  key={totalPayout}
  initial={{ opacity: 0, y: -4 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.25 }}
  style={{ color: UI.text, fontWeight: 800 }}
>
  {fmt2(totalPayout)} {symbol}
</motion.span>
            </div>
          </div>
        </div>

        <div
          className="rounded-[16px] p-5"
          style={{ background: UI.card, border: `1px solid ${UI.borderSoft}`, boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)' }}
        >
          <div className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: '#0c2b51' }}>
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
