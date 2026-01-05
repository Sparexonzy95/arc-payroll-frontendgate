// src/features/escrow/components/EscrowChatPanel.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  createEvidenceUpload,
  createMessage,
  listEvidence,
  listMessages,
  type Evidence,
  type EvidenceFile,
} from '../escrow.api'
import {
  IconPaperclip,
  IconSend,
  IconDownload,
  IconExternalLink,
  IconX,
  IconFileText,
  IconPhoto,
} from '@tabler/icons-react'

const NAVY = '#0E2A55'

function shortAddr(a?: string) {
  if (!a) return '—'
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

// Matches [[evidence:0x...]]
function extractEvidenceHash(text: string) {
  const m = text.match(/\[\[evidence:([^\]]+)\]\]/i)
  return m?.[1]?.trim() || null
}

function stripEvidenceTag(text: string) {
  return text.replace(/\s*\[\[evidence:[^\]]+\]\]\s*/gi, '').trim()
}

function niceSize(n?: number) {
  const b = Number(n ?? 0)
  if (!b) return ''
  if (b < 1024) return `${b}B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`
  return `${(b / (1024 * 1024)).toFixed(1)}MB`
}

function isImage(file: EvidenceFile) {
  const t = String(file.type ?? '').toLowerCase()
  const n = String(file.name ?? '').toLowerCase()
  return t.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(n)
}

function normalizeEvidenceFiles(ev: Evidence) {
  // prefer ev.files, fallback to ev.bundle.files
  const direct = Array.isArray(ev.files) ? ev.files : []
  const bundled = Array.isArray((ev.bundle as any)?.files) ? ((ev.bundle as any).files as any[]) : []
  const merged = (direct.length ? direct : bundled) as EvidenceFile[]
  return merged.filter(Boolean).map((f) => ({
    ...f,
    name: String((f as any).name ?? 'file'),
    url: (f as any).url ? String((f as any).url) : undefined,
    dataUrl: (f as any).dataUrl ? String((f as any).dataUrl) : undefined,
    type: (f as any).type ? String((f as any).type) : undefined,
    size: (f as any).size ? Number((f as any).size) : undefined,
  }))
}

function AttachmentCard({ f }: { f: EvidenceFile }) {
  const href = f.url || f.dataUrl || ''
  const canOpen = !!href

  const icon = isImage(f) ? <IconPhoto size={16} stroke={1.9} /> : <IconFileText size={16} stroke={1.9} />

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0 flex items-center gap-2">
        <div className="text-slate-700" style={{ color: NAVY }}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-slate-900">{f.name}</div>
          <div className="text-[11px] text-slate-500">
            {f.type ? f.type : 'file'}{f.size ? ` • ${niceSize(f.size)}` : ''}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={href || undefined}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${
            canOpen ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-slate-50 text-slate-400'
          }`}
          onClick={(e) => {
            if (!canOpen) {
              e.preventDefault()
              toast.error('File link not available yet. Check MEDIA_URL + backend file storage.')
            }
          }}
        >
          <IconExternalLink size={14} stroke={1.9} />
          Open
        </a>

        <a
          href={href || undefined}
          download={f.name || 'download'}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${
            canOpen ? 'text-white' : 'bg-slate-50 text-slate-400'
          }`}
          style={canOpen ? { backgroundColor: NAVY } : undefined}
          onClick={(e) => {
            if (!canOpen) {
              e.preventDefault()
              toast.error('File is missing a URL. Make sure Django serves /media and returns file.url.')
            }
          }}
        >
          <IconDownload size={14} stroke={1.9} />
          Download
        </a>
      </div>
    </div>
  )
}

export function EscrowChatPanel(props: { escrowPk: number; address?: string }) {
  const { escrowPk, address } = props
  const qc = useQueryClient()

  const [text, setText] = useState('')
  const [picked, setPicked] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement | null>(null)

  const chatQ = useQuery({
    queryKey: ['escrow-chat', escrowPk],
    queryFn: () => listMessages(escrowPk),
    enabled: escrowPk > 0,
    refetchInterval: 3000,
    refetchOnWindowFocus: false,
  })

  const evidenceQ = useQuery({
    queryKey: ['escrow-evidence', escrowPk],
    queryFn: () => listEvidence(escrowPk),
    enabled: escrowPk > 0,
    refetchInterval: 6000,
    refetchOnWindowFocus: false,
  })

  const evidenceMap = useMemo(() => {
    const map = new Map<string, Evidence>()
    ;(evidenceQ.data ?? []).forEach((ev) => {
      if (ev?.evidence_hash) map.set(String(ev.evidence_hash), ev)
    })
    return map
  }, [evidenceQ.data])

  const send = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Connect wallet to chat')
      const plain = text.trim()
      const hasFiles = picked.length > 0

      if (!plain && !hasFiles) throw new Error('Type a message or attach a file')

      let evidenceHash: string | null = null

      // If files exist, upload evidence first
      if (hasFiles) {
        const ev = await createEvidenceUpload({
          escrow: escrowPk,
          submitted_by_wallet: address,
          bundle: {
            kind: 'CHAT_ATTACHMENT',
            note: plain || '',
          },
          files: picked,
        })
        evidenceHash = ev.evidence_hash
      }

      // Construct message with evidence tag
      const msg = evidenceHash ? `${plain}\n\n[[evidence:${evidenceHash}]]` : plain

      const out = await createMessage({
        escrow: escrowPk,
        sender_wallet: address,
        message: msg,
      })

      return out
    },
    onSuccess: async () => {
      setText('')
      setPicked([])
      await qc.invalidateQueries({ queryKey: ['escrow-chat', escrowPk] })
      await qc.invalidateQueries({ queryKey: ['escrow-evidence', escrowPk] })
    },
  })

  // Auto-refresh evidence if new message references evidence
  useEffect(() => {
    const msgs = chatQ.data ?? []
    const last = msgs[msgs.length - 1]
    if (!last) return
    const h = extractEvidenceHash(String(last.message ?? ''))
    if (h) qc.invalidateQueries({ queryKey: ['escrow-evidence', escrowPk] })
  }, [chatQ.data, qc, escrowPk])

  const msgs = chatQ.data ?? []

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Chat</div>
        <div className="text-[11px] text-slate-500">{address ? shortAddr(address) : 'Connect wallet'}</div>
      </div>

      {/* Messages */}
      <div className="mt-2 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
        {chatQ.isLoading ? (
          <div className="text-xs text-slate-500">Loading…</div>
        ) : msgs.length === 0 ? (
          <div className="text-xs text-slate-500">No messages yet. Send evidence if there’s a dispute.</div>
        ) : (
          msgs.map((m) => {
            const mine = !!address && m.sender_wallet?.toLowerCase() === address.toLowerCase()
            const h = extractEvidenceHash(String(m.message ?? ''))
            const body = stripEvidenceTag(String(m.message ?? ''))
            const ev = h ? evidenceMap.get(h) ?? null : null
            const files = ev ? normalizeEvidenceFiles(ev) : []

            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 ${
                    mine ? 'text-white' : 'border border-slate-200 text-slate-900'
                  }`}
                  style={mine ? { backgroundColor: NAVY } : { backgroundColor: '#FFFFFF' }}
                >
                  <div className={`text-[11px] ${mine ? 'text-white/80' : 'text-slate-500'}`}>
                    {mine ? 'You' : shortAddr(m.sender_wallet)} • {new Date(m.created_at).toLocaleString()}
                  </div>

                  {body ? <div className={`mt-1 text-sm whitespace-pre-wrap ${mine ? 'text-white' : 'text-slate-900'}`}>{body}</div> : null}

                  {/* Attachments */}
                  {h && (
                    <div className={`mt-2 space-y-2 ${mine ? 'text-white' : ''}`}>
                      {!ev ? (
                        <div className={`rounded-xl px-3 py-2 text-[11px] ${mine ? 'bg-white/10' : 'bg-slate-50 text-slate-600'}`}>
                          Attachment loading… (evidence: {h.slice(0, 10)}…)
                        </div>
                      ) : files.length === 0 ? (
                        <div className={`rounded-xl px-3 py-2 text-[11px] ${mine ? 'bg-white/10' : 'bg-slate-50 text-slate-600'}`}>
                          Evidence received but no files were returned. Check backend file storage + MEDIA serving.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {files.map((f, idx) => (
                            <div key={`${f.name}-${idx}`}>
                              {/* inline image preview */}
                              {isImage(f) && (f.url || f.dataUrl) ? (
                                <a href={f.url || f.dataUrl} target="_blank" rel="noreferrer">
                                  <img
                                    src={f.url || f.dataUrl}
                                    alt={f.name}
                                    className="mb-2 max-h-48 w-full rounded-xl object-cover border border-slate-200"
                                  />
                                </a>
                              ) : null}
                              <AttachmentCard f={f} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="mt-2 space-y-2">
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
            {picked.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-800"
              >
                <IconPaperclip size={14} stroke={1.9} style={{ color: NAVY }} />
                {f.name}
                <button
                  type="button"
                  className="rounded-full p-1 hover:bg-slate-200"
                  onClick={() => setPicked((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <IconX size={14} stroke={1.9} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
            placeholder={address ? 'Type a message…' : 'Connect wallet to chat'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!address || send.isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!address) return
                send.mutate()
              }
            }}
          />

          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length === 0) return
              setPicked((prev) => [...prev, ...files].slice(0, 10))
              if (fileRef.current) fileRef.current.value = ''
            }}
          />

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            disabled={!address || send.isPending}
            onClick={() => fileRef.current?.click()}
            title="Attach files"
          >
            <IconPaperclip size={18} stroke={1.9} style={{ color: NAVY }} />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: NAVY }}
            disabled={!address || send.isPending || (!text.trim() && picked.length === 0)}
            onClick={() => send.mutate()}
          >
            <IconSend size={18} stroke={1.9} />
            {send.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>

        {send.isError ? (
          <div className="text-[11px] text-rose-600">{String((send.error as any)?.message ?? send.error)}</div>
        ) : null}
      </div>
    </div>
  )
}
