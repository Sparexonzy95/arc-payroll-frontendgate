// src/features/payrolls/PayrollList.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconFileText,
  IconWallet,
  IconChartBar,
  IconTag,
  IconCircleCheck,
  IconCash,
  IconUsers,
  IconLink,
  IconBolt,
} from '@tabler/icons-react'

import { usePayrolls } from '../../hooks/hooks/usePayrolls'
import { useChains } from '../../hooks/useChains'
import { useWalletEmployerBinding } from '../../hooks/useWalletEmployerBinding'

import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/Skeleton'
import { StatusPill } from '../../components/StatusPill'
import { ChainBadge } from '../../components/ChainBadge'
import { Button } from '../../components/ui/Button'

const PAGE_SIZE = 6

const TOKENS = {
  bg: {
    base: '#F7F9FC',
    card: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
  },
  border: 'rgba(15,23,42,0.08)',
  borderSoft: 'rgba(15,23,42,0.06)',
  hoverRow: 'rgba(15,23,42,0.03)',

  /* 🔵 ACTION COLOR (BASE) */
  primary: '#0c2b51',

  /* 🔵 SOFT HIGHLIGHT (NOT ACTION) */
  primarySoft: 'rgba(12,43,81,0.10)',
}
const PRIMARY_BTN = {
  background: '#0c2b51',
  border: '1px solid #0c2b51',
  color: '#ffffff',
}

const SECONDARY_BTN = {
  background: 'transparent',
  border: '1px solid rgba(12,43,81,0.35)',
  color: '#0c2b51',
}

const GHOST_BTN = {
  background: 'transparent',
  border: 'none',
  color: '#475569',
}

const GHOST_BTN_DISABLED = {
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  cursor: 'not-allowed',
}


function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function toNumberMaybe(v: any): number {
  if (v === null || v === undefined) return 0
  const s = String(v).replace(/,/g, '').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const usd = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
function formatUsd(n: number) {
  return usd.format(n)
}

export function PayrollList() {
  const { data: payrolls, isLoading, error } = usePayrolls()
  const { data: chains } = useChains()
  const { activeEmployerId } = useWalletEmployerBinding()

  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [activeEmployerId])

  const chainMap = useMemo(() => new Map((chains || []).map((c: any) => [c.id, c])), [chains])

  const filtered = useMemo(() => {
    if (!payrolls) return []
    if (!activeEmployerId) return payrolls
    return payrolls.filter((p: any) => p.employer === activeEmployerId)
  }, [payrolls, activeEmployerId])

  const sorted = useMemo(() => {
    return [...filtered].sort((a: any, b: any) => (b?.id ?? 0) - (a?.id ?? 0))
  }, [filtered])

  const total = sorted.length

  const kpis = useMemo(() => {
    const statusStr = (x: any) => String(x ?? '').toUpperCase()

    const activeCount = sorted.filter((p: any) => {
      const s = statusStr(p.status)
      return s === 'ACTIVE' || s.includes('ACTIVE')
    }).length

    const pendingDispatches = sorted.filter((p: any) => {
      const s = statusStr(p.status)
      return s.includes('PENDING') || s.includes('DISPATCH')
    }).length

    const totalMonthlyOutflow = sorted.reduce((acc: number, p: any) => {
      return acc + toNumberMaybe(p.total_net_amount)
    }, 0)

    return { activeCount, pendingDispatches, totalMonthlyOutflow }
  }, [sorted])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4 sm:p-5" style={{ background: TOKENS.bg.card }}>
          <Skeleton className="h-16 w-full" />
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-4 sm:px-5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <div className="px-4 pb-4 sm:px-5">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="mt-3 h-14 w-full" />
            <Skeleton className="mt-3 h-14 w-full" />
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-5 sm:p-6">
        <p className="text-[14px]" style={{ color: TOKENS.text.secondary }}>
          Failed to load payrolls. Please try again in a moment.
        </p>
      </Card>
    )
  }

  if (total === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[18px] sm:text-[20px] font-semibold" style={{ color: TOKENS.text.primary }}>
              Payrolls
            </h1>
            <p className="text-[13px]" style={{ color: TOKENS.text.secondary }}>
              Automated USDC / EURC payrolls on Arc.
            </p>
          </div>

          <Link to="/payrolls/new" className="w-full sm:w-auto">
            <Button
  size="sm"
  variant="primary"
  className="w-full sm:w-auto gap-2"
  
>

              <IconPlus size={16} />
              New Payroll
            </Button>
          </Link>
        </div>

        <Card className="p-5 sm:p-6" style={{ background: TOKENS.bg.card }}>
          <div
            className="text-center px-5 py-10 sm:px-6"
            style={{
              borderRadius: 16,
              border: `1px dashed ${TOKENS.border}`,
              background: 'rgba(15,23,42,0.02)',
            }}
          >
            <div
              className="mx-auto mb-3 inline-flex items-center justify-center rounded-full p-3"
              style={{ background: TOKENS.primarySoft }}
            >
              <IconFileText size={20} style={{ color: TOKENS.primary }} />
            </div>

            <p className="text-[18px] font-semibold" style={{ color: TOKENS.text.primary }}>
              No payrolls yet.
            </p>
            <p className="mt-2 text-[14px]" style={{ color: TOKENS.text.secondary }}>
              Create your first payroll to start streaming salaries on-chain.
            </p>

            <div className="mt-5 flex justify-center">
              <Link to="/payrolls/new" className="w-full sm:w-auto">
                <Button
  size="sm"
  variant="primary"
  className="gap-2"
  
>  <IconPlus size={16} />
                  New Payroll
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = clamp(page, 1, pageCount)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, total)
  const pageItems = sorted.slice(startIndex, endIndex)

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] sm:text-[20px] font-semibold" style={{ color: TOKENS.text.primary }}>
            Payrolls
          </h1>
          <p className="text-[13px]" style={{ color: TOKENS.text.secondary }}>
            Automated USDC / EURC payrolls on Arc.
          </p>
        </div>

        {/* Responsive actions (polished spacing) */}
        <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center">
          <Link to="/payrolls/new" className="w-full sm:w-auto">
            <Button
  size="sm"
  variant="primary"
  className="w-full sm:w-auto gap-2"
  
>
   <IconPlus size={16} />
              New Payroll
            </Button>
          </Link>

          <Link to="/dashboard?tool=gateway">
  <Button
    size="sm"
    variant="secondary"
    className="w-full sm:w-auto gap-2"
      

  >
    <IconWallet size={16} />
    Fund Wallet
  </Button>
</Link>
        </div>
      </div>

      {/* KPI strip: stacks on mobile */}
      <Card
        className="p-3 sm:p-5"
        style={{
          background: TOKENS.bg.card,
          border: `1px solid ${TOKENS.borderSoft}`,
          borderRadius: 16,
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-3 rounded-[14px] p-4" style={{ background: 'rgba(15,23,42,0.02)' }}>
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-full shrink-0"
              style={{ background: TOKENS.primarySoft }}
            >
              <IconCircleCheck size={18} style={{ color: TOKENS.primary }} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px]" style={{ color: TOKENS.text.secondary }}>
                Active Payrolls
              </p>
              <p className="text-[20px] font-semibold" style={{ color: TOKENS.text.primary }}>
                {kpis.activeCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[14px] p-4" style={{ background: 'rgba(15,23,42,0.02)' }}>
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-full shrink-0"
              style={{ background: TOKENS.primarySoft }}
            >
              <IconChartBar size={18} style={{ color: TOKENS.primary }} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px]" style={{ color: TOKENS.text.secondary }}>
                Total Monthly Outflow
              </p>
              <p className="text-[20px] font-semibold truncate" style={{ color: TOKENS.text.primary }}>
                {formatUsd(kpis.totalMonthlyOutflow)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[14px] p-4" style={{ background: 'rgba(15,23,42,0.02)' }}>
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-full shrink-0"
              style={{ background: TOKENS.primarySoft }}
            >
              <IconBolt size={18} style={{ color: TOKENS.primary }} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px]" style={{ color: TOKENS.text.secondary }}>
                Pending Dispatches
              </p>
              <p className="text-[20px] font-semibold" style={{ color: TOKENS.text.primary }}>
                {kpis.pendingDispatches}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Payrolls table card */}
      <Card
        className="p-0 overflow-hidden"
        style={{
          background: TOKENS.bg.card,
          borderRadius: 16,
          border: `1px solid ${TOKENS.borderSoft}`,
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="inline-flex h-9 w-9 items-center justify-center rounded-full shrink-0"
              style={{ background: 'rgba(15,23,42,0.04)' }}
            >
              <IconFileText size={18} style={{ color: TOKENS.text.secondary }} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold truncate" style={{ color: TOKENS.text.primary }}>
                Payrolls
              </p>
              <p className="text-[12px] truncate" style={{ color: TOKENS.text.muted }}>
                Manage your on-chain payroll streams.
              </p>
            </div>
          </div>
          <div />
        </div>

        {/* MOBILE LIST */}
        <div className="md:hidden px-4 pb-4 sm:px-5">
          <div className="space-y-3">
            {pageItems.map((p: any) => {
              const chain = chainMap.get(p.source_chain)
              return (
                <div
                  key={p.id}
                  className="p-3 sm:p-4"
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${TOKENS.borderSoft}`,
                    background: TOKENS.bg.card,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-[15px] font-semibold truncate" style={{ color: TOKENS.text.primary }}>
                        {p.title || 'Untitled payroll'}
                      </h3>

                      <p
                        className="flex flex-wrap items-center gap-2 text-[12px] font-mono"
                        style={{ color: TOKENS.text.muted }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <IconTag size={14} />
                          #{p.payroll_id}
                        </span>
                        <span style={{ opacity: 0.6 }}>•</span>
                        <span className="inline-flex items-center gap-1">
                          <IconUsers size={14} />
                          {p.total_payments} payments
                        </span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      {chain ? (
                        <ChainBadge name={chain.name} chainId={chain.chain_id} />
                      ) : (
                        <span className="text-[12px]" style={{ color: TOKENS.text.secondary }}>
                          Unknown
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <StatusPill status={p.status} />
                    <div className="ml-auto text-right min-w-0">
                      <p className="text-[11px] flex items-center justify-end gap-1" style={{ color: TOKENS.text.muted }}>
                        <IconCash size={14} />
                        Total Net
                      </p>
                      <p className="font-mono text-[14px] truncate" style={{ color: TOKENS.text.primary }}>
                        {p.total_net_amount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link to={`/payrolls/${p.id}`} className="block">
                      <Button size="sm" variant="secondary" className="w-full justify-center h-9 px-4 rounded-full gap-2
">
                        <IconEye size={16} />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile pagination */}
          <div className="pt-4">
            <div className="flex items-center justify-between gap-2" style={{ borderTop: `1px solid ${TOKENS.borderSoft}` }}>
              <div className="pt-3">
                <Button
  size="sm"
  variant="ghost"
  disabled={currentPage === 1}
  onClick={() => setPage((p) => Math.max(1, p - 1))}
  className="h-9 px-3 rounded-[12px] gap-2"
  style={currentPage === 1 ? GHOST_BTN_DISABLED : GHOST_BTN}
>
  <IconChevronLeft size={16} />
  Prev
</Button>
              </div>

              <div className="pt-3 text-[12px]" style={{ color: TOKENS.text.secondary }}>
                Page <span style={{ color: TOKENS.text.primary, fontWeight: 700 }}>{currentPage}</span> / {pageCount}
              </div>

              <div className="pt-3">
                <Button
  size="sm"
  variant="ghost"
  disabled={currentPage === pageCount}
  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
  className="h-9 px-3 rounded-[12px] gap-2"
  style={currentPage === pageCount ? GHOST_BTN_DISABLED : GHOST_BTN}
>
  Next
  <IconChevronRight size={16} />
</Button>

              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left" style={{ color: TOKENS.text.primary }}>
              <thead
                style={{
                  borderTop: `1px solid ${TOKENS.borderSoft}`,
                  borderBottom: `1px solid ${TOKENS.borderSoft}`,
                  background: 'rgba(15,23,42,0.015)',
                }}
              >
                <tr style={{ height: 46 }}>
                  <th className="py-3" style={{ paddingLeft: 20, paddingRight: 16, fontSize: 12, color: TOKENS.text.secondary }}>
                    <span className="inline-flex items-center gap-2">
                      <IconFileText size={16} />
                      Payroll Name
                    </span>
                  </th>

                  <th className="py-3" style={{ paddingLeft: 16, paddingRight: 16, fontSize: 12, color: TOKENS.text.secondary }}>
                    <span className="inline-flex items-center gap-2">
                      <IconCircleCheck size={16} />
                      Status
                    </span>
                  </th>

                  <th
                    className="py-3 text-right"
                    style={{ paddingLeft: 16, paddingRight: 16, fontSize: 12, color: TOKENS.text.secondary }}
                  >
                    <span className="inline-flex items-center gap-2 justify-end w-full">
                      <IconCash size={16} />
                      Total Net
                    </span>
                  </th>

                  <th className="py-3" style={{ paddingLeft: 16, paddingRight: 16, fontSize: 12, color: TOKENS.text.secondary }}>
                    <span className="inline-flex items-center gap-2">
                      <IconUsers size={16} />
                      Payments
                    </span>
                  </th>

                  <th className="py-3" style={{ paddingLeft: 16, paddingRight: 16, fontSize: 12, color: TOKENS.text.secondary }}>
                    <span className="inline-flex items-center gap-2">
                      <IconLink size={16} />
                      Chain
                    </span>
                  </th>

                  <th className="py-3" style={{ paddingLeft: 16, paddingRight: 20, fontSize: 12, color: TOKENS.text.secondary }}>
                    <span className="inline-flex items-center gap-2 justify-end w-full">
                      <IconEye size={16} />
                      Action
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {pageItems.map((p: any) => {
                  const chain = chainMap.get(p.source_chain)
                  return (
                    <tr
                      key={p.id}
                      className="transition-colors"
                      style={{ height: 58, borderTop: `1px solid ${TOKENS.borderSoft}` }}
                    >
                      <td className="align-middle hover:bg-[rgba(15,23,42,0.03)]" style={{ paddingLeft: 0, paddingRight: 0 }} colSpan={6}>
                        {/* Keep table structure intact but apply hover to full row via wrapper */}
                        <div className="grid grid-cols-[1fr_180px_160px_150px_160px_140px]">
                          <div className="py-3" style={{ paddingLeft: 20, paddingRight: 16 }}>
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-[15px] font-semibold truncate" style={{ color: TOKENS.text.primary }}>
                                {p.title || 'Untitled payroll'}
                              </span>

                              <span className="flex items-center gap-2 text-[12px] font-mono" style={{ color: TOKENS.text.muted }}>
                                <span className="inline-flex items-center gap-1">
                                  <IconTag size={14} />#{p.payroll_id}
                                </span>
                                <span style={{ opacity: 0.6 }}>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <IconUsers size={14} />
                                  {p.total_payments} payments
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="py-3" style={{ paddingLeft: 16, paddingRight: 16 }}>
                            <StatusPill status={p.status} />
                          </div>

                          <div className="py-3 text-right font-mono text-[14px]" style={{ paddingLeft: 16, paddingRight: 16 }}>
                            {p.total_net_amount}
                          </div>

                          <div className="py-3" style={{ paddingLeft: 16, paddingRight: 16 }}>
                            <span className="text-[13px]" style={{ color: TOKENS.text.secondary }}>
                              {p.total_payments} payments
                            </span>
                          </div>

                          <div className="py-3" style={{ paddingLeft: 16, paddingRight: 16 }}>
                            {chain ? (
                              <ChainBadge name={chain.name} chainId={chain.chain_id} />
                            ) : (
                              <span className="text-[13px]" style={{ color: TOKENS.text.secondary }}>
                                Unknown
                              </span>
                            )}
                          </div>

                          <div className="py-3 text-right" style={{ paddingLeft: 16, paddingRight: 20 }}>
                            <Link to={`/payrolls/${p.id}`}>
                              <Button size="sm" variant="secondary" className="h-9 px-4 rounded-full gap-2 ">
                                <IconEye size={16} />
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Desktop pagination */}
          <div
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4"
            style={{ borderTop: `1px solid ${TOKENS.borderSoft}` }}
          >
            <span className="text-[13px]" style={{ color: TOKENS.text.secondary }}>
              Showing{' '}
              <span style={{ color: TOKENS.text.primary, fontWeight: 600 }}>
                {startIndex + 1}–{endIndex}
              </span>{' '}
              of <span style={{ color: TOKENS.text.primary, fontWeight: 600 }}>{total}</span> payrolls
            </span>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <Button
  size="sm"
  variant="ghost"
  disabled={currentPage === 1}
  onClick={() => setPage((p) => Math.max(1, p - 1))}
  className="h-9 px-3 rounded-[12px] gap-2"
  style={currentPage === 1 ? GHOST_BTN_DISABLED : GHOST_BTN}
>
  <IconChevronLeft size={16} />
  Previous
</Button>


              <span
                className="hidden sm:inline-flex items-center gap-2 px-3 h-9 rounded-full text-[12px]"
                style={{
                  border: `1px solid ${TOKENS.borderSoft}`,
                  background: 'rgba(15,23,42,0.02)',
                  color: TOKENS.text.secondary,
                }}
              >
                <span style={{ color: TOKENS.text.primary, fontWeight: 600 }}>Page {currentPage}</span>
                <span style={{ color: TOKENS.text.muted }}>of {pageCount}</span>
              </span>

              <Button
  size="sm"
  variant="ghost"
  disabled={currentPage === pageCount}
  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
  className="h-9 px-3 rounded-[12px] gap-2"
  style={currentPage === pageCount ? GHOST_BTN_DISABLED : GHOST_BTN}
>
  Next
  <IconChevronRight size={16} />
</Button>

            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
