// src/features/escrow/components/EscrowDetailsDrawer.tsx
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Card } from '../../../components/ui/Card'
import { claimInvite, createDispute, createEvidence, createInvite, listEvidence, listMessages, createMessage } from '../escrow.api'
import { prettyErr, shortAddr } from '../utils/hashing'

export function EscrowDetailsDrawer(props: {
  open: boolean
  onClose: () => void
  escrow: any
  address?: string
  walletClient: any
}) {
  const { open, onClose, escrow, address, walletClient } = props
  const qc = useQueryClient()
  const [tab, setTab] = useState<'chat' | 'evidence' | 'invite' | 'dispute'>('chat')

  const escrowPk = Number(escrow?.id)

  const msgsQ = useQuery({
    queryKey: ['escrow-messages', escrowPk],
    queryFn: () => listMessages(escrowPk),
    enabled: open && Number.isFinite(escrowPk) && escrowPk > 0,
    refetchOnWindowFocus: false,
  })

  const evQ = useQuery({
    queryKey: ['escrow-evidence', escrowPk],
    queryFn: () => listEvidence(escrowPk),
    enabled: open && Number.isFinite(escrowPk) && escrowPk > 0,
    refetchOnWindowFocus: false,
  })

  const sendMsg = useMutation({
    mutationFn: (message: string) =>
      createMessage({ escrow: escrowPk, sender_wallet: address || '', message }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['escrow-messages', escrowPk] })
    },
  })

  const addEvidence = useMutation({
    mutationFn: (note: string) =>
      createEvidence({
        escrow: escrowPk,
        submitted_by_wallet: address || '',
        bundle: { note, ts: Date.now() },
        files: [],
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['escrow-evidence', escrowPk] })
    },
  })

  const openDispute = useMutation({
    mutationFn: () =>
      createDispute({
        escrow: escrowPk,
        opened_by_wallet: address || '',
      }),
  })

  const inviteMut = useMutation({
    mutationFn: async () => {
      const inv = await createInvite({ escrow: escrowPk, expires_in_minutes: 1440 }) // 24h
      return inv
    },
  })

  const canUse = !!address && !!walletClient

  const header = useMemo(() => {
    return `Escrow #${escrow?.escrow_id} (db id ${escrowPk})`
  }, [escrow?.escrow_id, escrowPk])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-3 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <Card className="rounded-2xl border border-slate-800 bg-[#050b26] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-100">{header}</div>
              <div className="mt-1 text-xs text-slate-400">
                payer {shortAddr(escrow?.payer_wallet)} • payee {shortAddr(escrow?.payee_wallet)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-[#02071c] px-3 py-1.5 text-xs text-slate-200"
            >
              Close
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['chat', 'evidence', 'invite', 'dispute'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  tab === t
                    ? 'bg-[#4189e1] text-white'
                    : 'border border-slate-800 bg-[#02071c] text-slate-200'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CHAT */}
          {tab === 'chat' && (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-slate-400">Messages</div>

              <div className="max-h-[280px] overflow-auto rounded-xl border border-slate-800 bg-[#02071c] p-3 space-y-2">
                {msgsQ.isLoading ? (
                  <div className="text-xs text-slate-400">Loading…</div>
                ) : (msgsQ.data ?? []).length === 0 ? (
                  <div className="text-xs text-slate-400">No messages yet.</div>
                ) : (
                  (msgsQ.data ?? []).map((m) => (
                    <div key={m.id} className="text-xs">
                      <div className="text-slate-500">{shortAddr(m.sender_wallet)} • {new Date(m.created_at).toLocaleString()}</div>
                      <div className="text-slate-100">{m.message}</div>
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
                    toast.success('Sent ✅', { id: tid })
                  } catch (e: any) {
                    toast.error(prettyErr(e), { id: tid })
                  }
                }}
                className="w-full rounded-xl bg-[#0b1336] px-4 py-2 text-xs font-semibold text-slate-100 border border-slate-800"
              >
                Send message
              </button>
            </div>
          )}

          {/* EVIDENCE */}
          {tab === 'evidence' && (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-slate-400">Evidence bundles (off-chain)</div>

              <div className="max-h-[280px] overflow-auto rounded-xl border border-slate-800 bg-[#02071c] p-3 space-y-2">
                {evQ.isLoading ? (
                  <div className="text-xs text-slate-400">Loading…</div>
                ) : (evQ.data ?? []).length === 0 ? (
                  <div className="text-xs text-slate-400">No evidence yet.</div>
                ) : (
                  (evQ.data ?? []).map((ev) => (
                    <div key={ev.id} className="text-xs">
                      <div className="text-slate-500">
                        {shortAddr(ev.submitted_by_wallet)} • {new Date(ev.created_at).toLocaleString()}
                      </div>
                      <div className="text-slate-300 break-all">hash: {ev.evidence_hash}</div>
                      <div className="text-slate-100">{String(ev.bundle?.note ?? '')}</div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={async () => {
                  if (!canUse) return toast.error('Connect wallet')
                  const note = prompt('Evidence note (short)')
                  if (!note) return
                  const tid = toast.loading('Saving evidence…')
                  try {
                    await addEvidence.mutateAsync(note)
                    toast.success('Saved ✅', { id: tid })
                  } catch (e: any) {
                    toast.error(prettyErr(e), { id: tid })
                  }
                }}
                className="w-full rounded-xl bg-[#0b1336] px-4 py-2 text-xs font-semibold text-slate-100 border border-slate-800"
              >
                Add evidence bundle
              </button>
            </div>
          )}

          {/* INVITE */}
          {tab === 'invite' && (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-slate-400">
                Create an invite link for payee. Claim will update payee wallet in DB.
              </div>

              <button
                onClick={async () => {
                  const tid = toast.loading('Creating invite…')
                  try {
                    const inv = await inviteMut.mutateAsync()
                    toast.success('Invite created ✅', { id: tid })
                    // show token, user can append it to frontend route
                    alert(`Invite token:\n\n${inv.token}\n\nClaim endpoint:\n/escrow/invites/${inv.token}/claim/`)
                  } catch (e: any) {
                    toast.error(prettyErr(e), { id: tid })
                  }
                }}
                className="w-full rounded-xl bg-[#4189e1] px-4 py-2 text-xs font-semibold text-white"
              >
                Create Invite (24h)
              </button>

              <button
                onClick={async () => {
                  if (!canUse) return toast.error('Connect wallet')
                  const token = prompt('Paste invite token')
                  if (!token) return

                  const message = `Arcflow Escrow Invite: ${token}`
                  const tid = toast.loading('Signing + claiming…')
                  try {
                    const signature = await walletClient.signMessage({ message })
                    await claimInvite(token, { wallet: address!, signature })
                    toast.success('Invite claimed ✅', { id: tid })
                  } catch (e: any) {
                    toast.error(prettyErr(e), { id: tid })
                  }
                }}
                className="w-full rounded-xl bg-[#0b1336] px-4 py-2 text-xs font-semibold text-slate-100 border border-slate-800"
              >
                Claim Invite (sign message)
              </button>
            </div>
          )}

          {/* DISPUTE */}
          {tab === 'dispute' && (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-slate-400">
                This only creates the dispute record in DB. The on-chain dispute is triggered from the row action.
              </div>

              <button
                onClick={async () => {
                  if (!canUse) return toast.error('Connect wallet')
                  const tid = toast.loading('Opening dispute record…')
                  try {
                    await openDispute.mutateAsync()
                    toast.success('Dispute record created ✅', { id: tid })
                  } catch (e: any) {
                    toast.error(prettyErr(e), { id: tid })
                  }
                }}
                className="w-full rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
              >
                Create Dispute Record (DB)
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
