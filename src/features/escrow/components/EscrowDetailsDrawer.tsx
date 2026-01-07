// src/features/escrow/components/EscrowDetailsDrawer.tsx
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Card } from '../../../components/ui/Card'
import {
  claimInvite,
  createDispute,
  createEvidence,
  createInvite,
  listEvidence,
  listMessages,
  createMessage,
} from '../escrow.api'
import { prettyErr, shortAddr } from '../utils/hashing'

const NAVY = '#0E2A55'

type Tab = 'chat' | 'evidence' | 'invite' | 'dispute'

export function EscrowDetailsDrawer(props: {
  open: boolean
  onClose: () => void
  escrow: any
  address?: string
  walletClient: any
}) {
  const { open, onClose, escrow, address, walletClient } = props
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('chat')

  const escrowPk = Number(escrow?.id)
  const canUse = !!address && !!walletClient

  const header = useMemo(
    () => `Escrow #${escrow?.escrow_id}`,
    [escrow?.escrow_id]
  )

  const msgsQ = useQuery({
    queryKey: ['escrow-messages', escrowPk],
    queryFn: () => listMessages(escrowPk),
    enabled: open && escrowPk > 0,
  })

  const evQ = useQuery({
    queryKey: ['escrow-evidence', escrowPk],
    queryFn: () => listEvidence(escrowPk),
    enabled: open && escrowPk > 0,
  })

  const sendMsg = useMutation({
    mutationFn: (message: string) =>
      createMessage({ escrow: escrowPk, sender_wallet: address || '', message }),
    onSuccess: async () =>
      qc.invalidateQueries({ queryKey: ['escrow-messages', escrowPk] }),
  })

  const addEvidence = useMutation({
    mutationFn: (note: string) =>
      createEvidence({
        escrow: escrowPk,
        submitted_by_wallet: address || '',
        bundle: { note },
        files: [],
      }),
    onSuccess: async () =>
      qc.invalidateQueries({ queryKey: ['escrow-evidence', escrowPk] }),
  })

  const openDispute = useMutation({
    mutationFn: () =>
      createDispute({ escrow: escrowPk, opened_by_wallet: address || '' }),
  })

  const inviteMut = useMutation({
    mutationFn: () =>
      createInvite({ escrow: escrowPk, expires_in_minutes: 1440 }),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4">
      <div className="mx-auto max-w-2xl">
        <Card className="rounded-2xl border border-subtle bg-surface-elevated shadow-soft">

          {/* HEADER */}
          <div className="flex items-start justify-between border-b border-subtle p-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-primary">
                {header}
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                payer {shortAddr(escrow?.payer_wallet)} · payee{' '}
                {shortAddr(escrow?.payee_wallet)}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink-primary"
            >
              Close
            </button>
          </div>

          {/* TABS */}
          <div className="flex gap-2 border-b border-subtle px-4 py-2">
            {(['chat', 'evidence', 'invite', 'dispute'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  tab === t
                    ? 'bg-surface-elevated shadow-soft text-ink-primary'
                    : 'text-ink-soft hover:text-ink-primary',
                ].join(' ')}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* BODY */}
          <div className="p-4 space-y-4">

            {/* CHAT */}
            {tab === 'chat' && (
              <>
                <div className="rounded-xl border border-subtle bg-surface-sunken p-3 space-y-2 max-h-[280px] overflow-auto">
                  {msgsQ.isLoading ? (
                    <p className="text-xs text-ink-soft">Loading…</p>
                  ) : (msgsQ.data ?? []).length === 0 ? (
                    <p className="text-xs text-ink-soft">No messages yet.</p>
                  ) : (
                    msgsQ.data!.map((m) => (
                      <div key={m.id}>
                        <div className="text-[11px] text-ink-muted">
                          {shortAddr(m.sender_wallet)} ·{' '}
                          {new Date(m.created_at).toLocaleString()}
                        </div>
                        <div className="text-sm">{m.message}</div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={async () => {
                    if (!canUse) return toast.error('Connect wallet')
                    const text = prompt('Message')
                    if (!text) return
                    const tid = toast.loading('Sending…')
                    try {
                      await sendMsg.mutateAsync(text)
                      toast.success('Sent', { id: tid })
                    } catch (e: any) {
                      toast.error(prettyErr(e), { id: tid })
                    }
                  }}
                  className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: NAVY }}
                >
                  Send message
                </button>
              </>
            )}

            {/* EVIDENCE */}
            {tab === 'evidence' && (
              <>
                <div className="rounded-xl border border-subtle bg-surface-sunken p-3 space-y-2 max-h-[280px] overflow-auto">
                  {evQ.isLoading ? (
                    <p className="text-xs text-ink-soft">Loading…</p>
                  ) : (evQ.data ?? []).length === 0 ? (
                    <p className="text-xs text-ink-soft">No evidence yet.</p>
                  ) : (
                    evQ.data!.map((ev) => (
                      <div key={ev.id}>
                        <div className="text-[11px] text-ink-muted">
                          {shortAddr(ev.submitted_by_wallet)} ·{' '}
                          {new Date(ev.created_at).toLocaleString()}
                        </div>
                        <div className="text-[11px] font-mono break-all">
                          {ev.evidence_hash}
                        </div>
                        <div className="text-sm">{ev.bundle?.note}</div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={async () => {
                    if (!canUse) return toast.error('Connect wallet')
                    const note = prompt('Evidence note')
                    if (!note) return
                    const tid = toast.loading('Saving…')
                    try {
                      await addEvidence.mutateAsync(note)
                      toast.success('Saved', { id: tid })
                    } catch (e: any) {
                      toast.error(prettyErr(e), { id: tid })
                    }
                  }}
                  className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: NAVY }}
                >
                  Add evidence
                </button>
              </>
            )}

            {/* INVITE */}
            {tab === 'invite' && (
              <>
                <p className="text-xs text-ink-soft">
                  Generate an invite link for the payee (valid 24h).
                </p>

                <button
                  onClick={async () => {
                    const tid = toast.loading('Creating invite…')
                    try {
                      const inv = await inviteMut.mutateAsync()
                      toast.success('Invite created', { id: tid })
                      alert(inv.token)
                    } catch (e: any) {
                      toast.error(prettyErr(e), { id: tid })
                    }
                  }}
                  className="w-full rounded-xl border border-subtle bg-surface-elevated px-4 py-2 text-sm font-semibold"
                >
                  Create invite
                </button>
              </>
            )}

            {/* DISPUTE */}
            {tab === 'dispute' && (
              <>
                <p className="text-xs text-ink-soft">
                  Creates a dispute record in the backend.
                </p>

                <button
                  onClick={async () => {
                    if (!canUse) return toast.error('Connect wallet')
                    const tid = toast.loading('Opening dispute…')
                    try {
                      await openDispute.mutateAsync()
                      toast.success('Dispute created', { id: tid })
                    } catch (e: any) {
                      toast.error(prettyErr(e), { id: tid })
                    }
                  }}
                  className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Create dispute
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
