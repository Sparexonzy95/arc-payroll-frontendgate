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

/* ---------- helpers ---------- */

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
  const direct = Array.isArray(ev.files) ? ev.files : []
  const bundled = Array.isArray((ev.bundle as any)?.files)
    ? ((ev.bundle as any).files as any[])
    : []
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

/* ---------- attachment ---------- */

function AttachmentCard({ f }: { f: EvidenceFile }) {
  const href = f.url || f.dataUrl || ''
  const canOpen = !!href

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-elevated px-3 py-2 shadow-soft">
      <div className="flex min-w-0 items-center gap-2">
        <div style={{ color: NAVY }}>
          {isImage(f) ? <IconPhoto size={16} /> : <IconFileText size={16} />}
        </div>

        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-ink-primary">
            {f.name}
          </div>
          <div className="text-[11px] text-ink-muted">
            {f.type || 'file'} {f.size ? `• ${niceSize(f.size)}` : ''}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={href || undefined}
          target="_blank"
          rel="noreferrer"
          className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
            canOpen
              ? 'bg-surface-sunken text-ink-primary hover:opacity-80'
              : 'text-ink-muted'
          }`}
          onClick={(e) => {
            if (!canOpen) {
              e.preventDefault()
              toast.error('File link not available yet.')
            }
          }}
        >
          <IconExternalLink size={14} />
        </a>

        <a
          href={href || undefined}
          download={f.name}
          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-white"
          style={{ backgroundColor: NAVY }}
          onClick={(e) => {
            if (!canOpen) {
              e.preventDefault()
              toast.error('File URL missing.')
            }
          }}
        >
          <IconDownload size={14} />
        </a>
      </div>
    </div>
  )
}

/* ---------- main ---------- */

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
  })

  const evidenceQ = useQuery({
    queryKey: ['escrow-evidence', escrowPk],
    queryFn: () => listEvidence(escrowPk),
    enabled: escrowPk > 0,
    refetchInterval: 6000,
  })

  const evidenceMap = useMemo(() => {
    const m = new Map<string, Evidence>()
    ;(evidenceQ.data ?? []).forEach((ev) => {
      if (ev?.evidence_hash) m.set(String(ev.evidence_hash), ev)
    })
    return m
  }, [evidenceQ.data])

  const send = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Connect wallet')
      if (!text.trim() && picked.length === 0)
        throw new Error('Type a message or attach a file')

      let evidenceHash: string | null = null

      if (picked.length > 0) {
        const ev = await createEvidenceUpload({
          escrow: escrowPk,
          submitted_by_wallet: address,
          bundle: { kind: 'CHAT_ATTACHMENT', note: text || '' },
          files: picked,
        })
        evidenceHash = ev.evidence_hash
      }

      const msg = evidenceHash
        ? `${text}\n\n[[evidence:${evidenceHash}]]`
        : text

      await createMessage({
        escrow: escrowPk,
        sender_wallet: address,
        message: msg,
      })
    },
    onSuccess: async () => {
      setText('')
      setPicked([])
      await qc.invalidateQueries({ queryKey: ['escrow-chat', escrowPk] })
      await qc.invalidateQueries({ queryKey: ['escrow-evidence', escrowPk] })
    },
  })

  const msgs = chatQ.data ?? []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-ink-primary">Chat</div>
        <div className="text-[11px] text-ink-muted">
          {address ? shortAddr(address) : 'Connect wallet'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto rounded-2xl bg-surface-sunken p-3 space-y-3">
        {msgs.length === 0 ? (
          <div className="text-xs text-ink-muted">
            No messages yet.
          </div>
        ) : (
          msgs.map((m) => {
            const mine =
              address &&
              m.sender_wallet?.toLowerCase() === address.toLowerCase()

            const h = extractEvidenceHash(String(m.message))
            const body = stripEvidenceTag(String(m.message))
            const ev = h ? evidenceMap.get(h) ?? null : null
            const files = ev ? normalizeEvidenceFiles(ev) : []

            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-3 py-2 shadow-soft"
                  style={
                    mine
                      ? { backgroundColor: NAVY, color: 'white' }
                      : {}
                  }
                >
                  <div
                    className={`text-[11px] ${
                      mine ? 'text-white/80' : 'text-ink-muted'
                    }`}
                  >
                    {mine ? 'You' : shortAddr(m.sender_wallet)} ·{' '}
                    {new Date(m.created_at).toLocaleString()}
                  </div>

                  {body && (
                    <div className="mt-1 text-sm whitespace-pre-wrap">
                      {body}
                    </div>
                  )}

                  {h && (
                    <div className="mt-2 space-y-2">
                      {files.map((f, i) => (
                        <AttachmentCard key={i} f={f} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="mt-3 space-y-2">
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-2xl bg-surface-elevated p-2">
            {picked.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-full bg-surface-sunken px-3 py-1 text-[11px]"
              >
                <IconPaperclip size={14} style={{ color: NAVY }} />
                {f.name}
                <button onClick={() => setPicked((p) => p.filter((_, x) => x !== i))}>
                  <IconX size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl bg-surface-elevated px-3 py-2 text-sm outline-none"
            placeholder={address ? 'Type a message…' : 'Connect wallet to chat'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!address || send.isPending}
          />

          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              setPicked(Array.from(e.target.files ?? []).slice(0, 10))
              if (fileRef.current) fileRef.current.value = ''
            }}
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl bg-surface-elevated px-3"
          >
            <IconPaperclip size={18} style={{ color: NAVY }} />
          </button>

          <button
            onClick={() => send.mutate()}
            disabled={!address || send.isPending}
            className="rounded-2xl px-4 text-white"
            style={{ backgroundColor: NAVY }}
          >
            <IconSend size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
