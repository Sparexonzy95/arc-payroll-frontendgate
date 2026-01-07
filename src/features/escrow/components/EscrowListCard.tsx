// src/features/escrow/components/EscrowListCard.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { EscrowRow } from './EscrowRow'
import {
  IconReload,
  IconChevronLeft,
  IconChevronRight,
  IconDoorEnter,
} from '@tabler/icons-react'

const NAVY = '#0E2A55'

export function EscrowListCard(props: {
  escrows: any[]
  isLoading: boolean
  isError: boolean
  onRefreshClick: () => void

  address?: string
  wrongChain: boolean
  tokensReady: boolean
  arcTokens: any[]
  disputeFee: bigint | null
  busy: boolean
  setBusy: (v: boolean) => void
  walletClient: any
  publicClient: any
  onRefresh: () => Promise<void>

  chainId?: number
}) {
  const nav = useNavigate()
  const { escrows, isLoading, isError, onRefreshClick, ...rest } = props

  /* Pagination */
  const PAGE_SIZE = 2
  const [page, setPage] = useState(1)

  const total = escrows?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
    if (page < 1) setPage(1)
  }, [page, pageCount])

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return (escrows ?? []).slice(start, start + PAGE_SIZE)
  }, [escrows, page])

  const canPrev = page > 1
  const canNext = page < pageCount

  return (
    <Card className="rounded-2xl border border-subtle bg-surface-elevated p-0 shadow-soft">
      {/* HEADER */}
      <div className="p-4 sm:p-5">
        <div
          className="relative overflow-hidden rounded-2xl px-4 py-4 sm:px-5 sm:py-5"
          style={{ backgroundColor: NAVY }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/10" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-white">
                Your escrows
              </h3>
              <p className="mt-1 text-xs text-white/75">
                {isLoading
                  ? 'Loading escrows…'
                  : isError
                  ? 'Unable to load escrows'
                  : total === 0
                  ? 'No escrows yet. Create one above.'
                  : `Page ${page} of ${pageCount}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPage(1)
                onRefreshClick()
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/15"
            >
              <IconReload size={16} stroke={1.9} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-subtle bg-surface-sunken p-4 text-sm text-ink-soft">
              Loading…
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Failed to load escrows.
            </div>
          ) : total === 0 ? (
            <div className="rounded-xl border border-subtle bg-surface-sunken p-4 text-sm text-ink-soft">
              No escrows yet.
            </div>
          ) : (
            <div className="space-y-4">
              {pageItems.map((e: any) => (
                <div key={e.id} className="space-y-2">
                  <EscrowRow e={e} {...rest} />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => nav(`/escrow/room/${e.escrow_id}`)}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm"
                      style={{ backgroundColor: NAVY }}
                    >
                      <IconDoorEnter size={16} stroke={1.9} />
                      Open room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !isError && total > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-sunken px-3 py-2">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-2 rounded-lg border border-subtle bg-surface-elevated px-3 py-2 text-xs font-semibold text-ink-primary disabled:opacity-50"
              >
                <IconChevronLeft size={16} stroke={1.9} />
                Prev
              </button>

              <div className="text-xs text-ink-soft">
                <span className="font-semibold text-ink-primary">{page}</span> /{' '}
                <span className="font-semibold text-ink-primary">{pageCount}</span>
              </div>

              <button
                type="button"
                disabled={!canNext}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
              >
                Next
                <IconChevronRight size={16} stroke={1.9} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
