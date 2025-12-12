// src/features/payrolls/PayrollList.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { usePayrolls } from '../../hooks/hooks/usePayrolls'
import { useChains } from '../../hooks/useChains'
import { useWalletEmployerBinding } from '../../hooks/useWalletEmployerBinding'

import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/Skeleton'
import { StatusPill } from '../../components/StatusPill'
import { ChainBadge } from '../../components/ChainBadge'
import { Button } from '../../components/ui/Button'

const PAGE_SIZE = 6

export function PayrollList() {
  const { data: payrolls, isLoading, error } = usePayrolls()
  const { data: chains } = useChains()
  const { activeEmployerId } = useWalletEmployerBinding()

  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [activeEmployerId])

  if (isLoading) {
    return (
      <Card className="space-y-4 rounded-2xl border border-subtle bg-surface-elevated p-5 sm:p-6">
        <Skeleton className="h-6 w-32 sm:h-7 sm:w-40" />
        <Skeleton className="h-9 w-full sm:h-10" />
        <Skeleton className="h-9 w-full sm:h-10" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-2xl border border-rose-500/40 bg-surface-elevated p-5 sm:p-6">
        <p className="text-sm sm:text-[15px] text-rose-200">
          Failed to load payrolls. Please try again in a moment.
        </p>
      </Card>
    )
  }

  const chainMap = new Map((chains || []).map((c) => [c.id, c]))

  const filtered =
    activeEmployerId && payrolls
      ? payrolls.filter((p) => p.employer === activeEmployerId)
      : payrolls || []

  const sorted = [...filtered].sort((a, b) => b.id - a.id)
  const total = sorted.length

  // --------------------------------------
  // EMPTY STATE
  // --------------------------------------
  if (total === 0) {
    return (
      <Card className="space-y-6 rounded-2xl border border-subtle bg-surface-elevated p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold tracking-tight text-ink-primary">
              Payrolls
            </h2>
            <p className="mt-1 text-sm sm:text-[15px] md:text-base text-ink-soft">
              All payrolls associated with your employer profile will appear here.
            </p>
          </div>

          <Link to="/payrolls/new">
            <Button
              size="sm"
              variant="primary"
              className="w-full text-[12px] sm:w-auto md:text-[13px]"
            >
              New payroll
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-dashed border-subtle bg-surface-sunken px-5 py-7 sm:px-6 sm:py-8 text-center">
          <p className="text-lg sm:text-xl font-semibold text-ink-primary">
            No payrolls yet.
          </p>
          <p className="mt-2 text-sm sm:text-[15px] md:text-base text-ink-muted">
            Create your first payroll to start streaming salaries on-chain.
          </p>
        </div>
      </Card>
    )
  }

  // --------------------------------------
  // PAGINATION SETUP
  // --------------------------------------
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, total)
  const pageItems = sorted.slice(startIndex, endIndex)

  return (
    <Card className="space-y-5 rounded-2xl border border-subtle bg-surface-elevated p-5 sm:p-6 lg:p-7">
      {/* header + CTA */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold tracking-tight text-ink-primary">
            Payrolls
          </h2>
          <p className="mt-1 text-sm sm:text-[15px] md:text-base text-ink-soft">
            All payrolls associated with your employer profile.
          </p>
        </div>

        <Link to="/payrolls/new">
          <Button
            size="sm"
            variant="primary"
            className="w-full text-[12px] sm:w-auto md:text-[13px]"
          >
            New payroll
          </Button>
        </Link>
      </div>

      {/* MOBILE LIST (cards) */}
      <div className="space-y-3 sm:space-y-4 md:hidden">
        {pageItems.map((p) => {
          const chain = chainMap.get(p.source_chain)

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-subtle bg-surface-sunken px-4 py-4 sm:px-5 sm:py-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h3 className="text-[15px] sm:text-[16px] font-semibold text-ink-primary">
                    {p.title || 'Untitled payroll'}
                  </h3>
                  <p className="text-[11px] sm:text-[12px] font-mono text-ink-muted">
                    #{p.payroll_id} • {p.total_payments} payments
                  </p>
                </div>
                {chain ? (
                  <ChainBadge name={chain.name} chainId={chain.chain_id} />
                ) : (
                  <span className="text-[11px] sm:text-[12px] text-ink-soft">
                    Unknown
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusPill status={p.status} />

                <div className="ml-auto text-right">
                  <p className="text-[11px] text-ink-muted">Total net</p>
                  <p className="font-mono text-[14px] text-ink-primary">
                    {p.total_net_amount}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-ink-muted">Total tax</p>
                  <p className="font-mono text-[14px] text-ink-primary">
                    {p.total_tax_amount}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex">
                <Link to={`/payrolls/${p.id}`} className="w-full">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-center"
                  >
                    View payroll
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* DESKTOP / TABLE VIEW */}
      <div className="relative hidden overflow-x-auto rounded-2xl border border-subtle bg-surface-sunken md:block">
        <table className="min-w-full text-left text-[13px] lg:text-[15px] text-ink-primary">
          <thead className="border-b border-subtle bg-surface-elevated text-[11px] lg:text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
            <tr className="h-12">
              <th className="px-5 py-3">Payroll</th>
              <th className="px-5 py-3">Chain</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Total net</th>
              <th className="px-5 py-3 text-right">Total tax</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-subtle">
            {pageItems.map((p) => {
              const chain = chainMap.get(p.source_chain)

              return (
                <tr
                  key={p.id}
                  className="h-16 transition-colors hover:bg-[rgba(5,13,25,0.96)]"
                >
                  {/* title + meta */}
                  <td className="px-5 py-3 align-middle">
                    <div className="flex flex-col gap-1">
                      <span className="text-[15px] lg:text-[16px] font-semibold text-ink-primary">
                        {p.title || 'Untitled payroll'}
                      </span>
                      <span className="text-[12px] lg:text-[13px] font-mono text-ink-muted">
                        #{p.payroll_id} • {p.total_payments} payments
                      </span>
                    </div>
                  </td>

                  {/* chain */}
                  <td className="px-5 py-3 align-middle">
                    {chain ? (
                      <ChainBadge
                        name={chain.name}
                        chainId={chain.chain_id}
                      />
                    ) : (
                      <span className="text-[13px] text-ink-soft">
                        Unknown
                      </span>
                    )}
                  </td>

                  {/* status */}
                  <td className="px-5 py-3 align-middle">
                    <StatusPill status={p.status} />
                  </td>

                  {/* totals */}
                  <td className="px-5 py-3 align-middle text-right font-mono text-[14px] lg:text-[15px] text-ink-primary">
                    {p.total_net_amount}
                  </td>

                  <td className="px-5 py-3 align-middle text-right font-mono text-[14px] lg:text-[15px] text-ink-primary">
                    {p.total_tax_amount}
                  </td>

                  {/* action */}
                  <td className="px-5 py-3 align-middle text-right">
                    <Link to={`/payrolls/${p.id}`}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex flex-col gap-3 border-t border-subtle pt-4 text-[12px] sm:text-[13px] text-ink-soft md:flex-row md:items-center md:justify-between">
        <span className="text-ink-muted">
          Showing{' '}
          <span className="text-ink-primary">
            {startIndex + 1}–{endIndex}
          </span>{' '}
          of{' '}
          <span className="text-ink-primary">
            {total}
          </span>{' '}
          payrolls
        </span>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>

          {/* simple pager chip */}
          <span className="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface-sunken px-3 py-1 text-[11px] sm:text-[12px] font-medium text-ink-soft">
            <span className="text-ink-primary">
              Page {currentPage}
            </span>
            <span className="text-ink-muted">of {pageCount}</span>
          </span>

          <Button
            size="sm"
            variant="ghost"
            disabled={currentPage === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}
