import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import { Input } from '../../../../components/ui/Input'
import { Select } from '../../../../components/ui/Select'
import { UI } from '../ui'
import { shortAddr } from '../utils'
import type { TokenDTO, ChainDTO } from '../../../../api/chains'
import { ReqRow } from './ReqRow'
import {
  IconBuilding,
  IconPlanet,
  IconCircleCheck,
  IconCoin,
  IconChevronDown,
  IconSearch,
} from '@tabler/icons-react'

function UsdcSvg({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#2775CA" />
      <path
        fill="#fff"
        d="M36.6 36.9c0-2.7-1.6-3.7-4.8-4.5-2.3-.6-2.9-1.1-2.9-2 0-.9.8-1.6 2.3-1.6 1.6 0 2.7.6 3.3 2l3.3-1.9c-1-1.9-2.7-3.1-5.1-3.4v-2.7h-2.7v2.7c-3 .5-5 2.4-5 5.2 0 2.8 1.7 3.9 4.9 4.6 2.4.6 2.9 1.1 2.9 2 0 1-.9 1.7-2.5 1.7-1.9 0-3.1-.8-3.8-2.4l-3.4 2c1 2.1 2.9 3.4 5.4 3.7v2.6h2.7V43c3.3-.5 5.4-2.6 5.4-6.1Z"
      />
      <path
        fill="#fff"
        d="M26.2 15.3c-5.8 2.2-9.9 7.9-9.9 14.7 0 6.8 4.1 12.5 9.9 14.7l1.2-3.3c-4.5-1.8-7.6-6.2-7.6-11.4 0-5.2 3.1-9.6 7.6-11.4l-1.2-3.3Zm11.6 0-1.2 3.3c4.5 1.8 7.6 6.2 7.6 11.4 0 5.2-3.1 9.6-7.6 11.4l1.2 3.3c5.8-2.2 9.9-7.9 9.9-14.7 0-6.8-4.1-12.5-9.9-14.7Z"
        opacity=".9"
      />
    </svg>
  )
}

function EurcSvg({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#1E3A8A" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#FFD54A" strokeWidth="3" opacity="0.9" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (Math.PI * 2 * i) / 8
        const x = 32 + Math.cos(a) * 20
        const y = 32 + Math.sin(a) * 20
        return <circle key={i} cx={x} cy={y} r="1.6" fill="#FFD54A" />
      })}
      <path
        fill="#fff"
        d="M39.8 22.8c-1.5-1.6-3.6-2.5-6.4-2.5-4.1 0-7.2 2.3-8.5 6.2h-3v2.9h2.4c0 .3 0 .6 0 .9s0 .6 0 .9h-2.4V34h3c1.3 4 4.4 6.2 8.5 6.2 2.8 0 4.9-.9 6.4-2.5l-2.2-2.1c-.9 1-2.2 1.5-4.1 1.5-2.2 0-3.9-1.1-4.8-3.1h7.3v-2.9h-7.9c0-.3 0-.6 0-.9s0-.6 0-.9h7.9v-2.9h-7.3c.9-2 2.6-3.1 4.8-3.1 1.9 0 3.2.5 4.1 1.5l2.2-2.1Z"
      />
    </svg>
  )
}

function TokenIcon({ symbol }: { symbol?: string }) {
  const s = (symbol || '').toUpperCase()
  if (s === 'USDC') return <UsdcSvg size={16} />
  if (s === 'EURC') return <EurcSvg size={16} />
  return <IconCoin size={16} />
}

function ContextRow({
  icon,
  title,
  subtitle,
  tone = 'default',
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  tone?: 'default' | 'success'
}) {
  const bg = tone === 'success' ? 'rgba(22,163,74,0.10)' : 'rgba(15,23,42,0.04)'
  const border = tone === 'success' ? '1px solid rgba(22,163,74,0.14)' : `1px solid ${UI.borderSoft}`
  const color = tone === 'success' ? '#16A34A' : UI.navy

  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-[2px] inline-flex h-8 w-8 items-center justify-center rounded-full"
        style={{ background: bg, border, color }}
      >
        {icon}
      </span>

      <div className="min-w-0">
        <div className="text-[13px] font-semibold" style={{ color: UI.text }}>
          {title}
        </div>
        <div className="text-[12px]" style={{ color: UI.muted }}>
          {subtitle}
        </div>
      </div>
    </div>
  )
}

function TokenDropdown({
  tokens,
  value,
  disabled,
  onChange,
}: {
  tokens: TokenDTO[]
  value: string
  disabled?: boolean
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const selected = useMemo(() => {
    const v = (value || '').toLowerCase()
    return tokens.find((t) => t.address.toLowerCase() === v)
  }, [tokens, value])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return tokens
    return tokens.filter((t) => {
      const hay = `${t.symbol} ${t.address}`.toLowerCase()
      return hay.includes(query)
    })
  }, [tokens, q])

  function close() {
    setOpen(false)
    setQ('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-[12px] px-3 py-2 flex items-center justify-between gap-3"
        style={{
          background: disabled ? 'rgba(15,23,42,0.03)' : UI.card,
          border: `1px solid ${UI.borderSoft}`,
          color: UI.text,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: 'rgba(15,23,42,0.04)' }}
          >
            <TokenIcon symbol={selected?.symbol} />
          </span>
          <div className="min-w-0 text-left">
            <div className="text-[14px] font-semibold truncate">
              {selected ? selected.symbol : 'Select token'}
            </div>
            <div className="text-[12px] truncate" style={{ color: UI.muted }}>
              {selected ? shortAddr(selected.address) : '—'}
            </div>
          </div>
        </div>

        <IconChevronDown size={18} style={{ color: UI.muted }} />
      </button>

      {open && !disabled && (
        <div
          className="absolute z-50 mt-2 w-full rounded-[14px] overflow-hidden"
          style={{
            background: UI.card,
            border: `1px solid ${UI.borderSoft}`,
            boxShadow: '0 18px 40px rgba(2, 6, 23, 0.12)',
          }}
        >
          <div className="p-3" style={{ borderBottom: `1px solid ${UI.borderSoft}` }}>
            <div
              className="flex items-center gap-2 rounded-[12px] px-3 py-2"
              style={{ background: 'rgba(15,23,42,0.03)' }}
            >
              <IconSearch size={16} style={{ color: UI.muted }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search token"
                className="w-full bg-transparent outline-none text-[13px]"
                style={{ color: UI.text }}
              />
            </div>
          </div>

          <div className="max-h-[260px] overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-[13px]" style={{ color: UI.muted }}>
                No tokens found
              </div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onChange(t.address)
                    close()
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:opacity-90"
                  style={{ borderTop: `1px solid ${UI.borderSoft}` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: 'rgba(15,23,42,0.04)' }}
                    >
                      <TokenIcon symbol={t.symbol} />
                    </span>
                    <div className="min-w-0 text-left">
                      <div className="text-[14px] font-semibold" style={{ color: UI.text }}>
                        {t.symbol}
                      </div>
                      <div className="text-[12px] truncate" style={{ color: UI.muted }}>
                        {shortAddr(t.address)}
                      </div>
                    </div>
                  </div>

                  <span className="text-[12px]" style={{ color: UI.muted }}>
                    {t.decimals} dp
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {open && (
        <button
          type="button"
          aria-label="Close token dropdown"
          onClick={close}
          className="fixed inset-0 z-40 cursor-default"
          style={{ background: 'transparent' }}
        />
      )}
    </div>
  )
}

export function Step1Basics({
  arcChains,
  filteredTokens,
  sourceChainId,
  defaultTokenAddress,
  title,
  description,
  setSourceChainId,
  setDefaultTokenAddress,
  setTitle,
  setDescription,
  employerName,
  chain,
  token,
  hasBasics,
}: {
  arcChains: ChainDTO[]
  filteredTokens: TokenDTO[]
  sourceChainId: number | ''
  defaultTokenAddress: string
  title: string
  description: string
  setSourceChainId: (v: number | '') => void
  setDefaultTokenAddress: (v: string) => void
  setTitle: (v: string) => void
  setDescription: (v: string) => void
  employerName: string
  chain?: ChainDTO
  token?: TokenDTO
  hasBasics: boolean
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] pb-10 sm:pb-14">
      {/* LEFT */}
      <div
        className="rounded-[16px] p-5 sm:p-6"
        style={{ background: 'rgba(15,23,42,0.02)', border: `1px solid ${UI.borderSoft}` }}
      >
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
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSourceChainId(e.target.value ? Number(e.target.value) : '')
              }
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

            {/* ✅ custom dropdown so SVG icons actually render */}
            <TokenDropdown
              tokens={filteredTokens}
              value={defaultTokenAddress}
              onChange={setDefaultTokenAddress}
              disabled={!sourceChainId}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium" style={{ color: UI.text }}>
              Payroll Name
            </label>
            <Input
              className="text-[15px]"
              placeholder="e.g. January salaries"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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
          <div className="text-[15px] font-semibold" style={{ color: UI.text }}>
            Payroll Context
          </div>

          <div className="mt-4 space-y-4">
            <ContextRow icon={<IconBuilding size={16} />} title={employerName} subtitle="Employer" />
            <ContextRow icon={<IconPlanet size={16} />} title={chain?.name || '—'} subtitle="Settlement Network" />
            <ContextRow
              icon={<TokenIcon symbol={token?.symbol} />}
              title={token ? `${token.symbol} (${shortAddr(token.address)})` : '—'}
              subtitle="Settlement Token"
            />
            <ContextRow icon={<IconCircleCheck size={16} />} title="One-time payroll (default)" subtitle="Type" tone="success" />
          </div>
        </div>

        <div
          className="rounded-[16px] p-5"
          style={{
            background: UI.card,
            border: `1px solid ${UI.borderSoft}`,
            boxShadow: '0 10px 28px rgba(2, 6, 23, 0.06)',
          }}
        >
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
  )
}
