import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { zeroAddress } from 'viem'
import { Card } from '../../../components/ui/Card'
import { createEvidence, listEvidence } from '../escrow.api'
import { arcflowEscrowAbi, ARCFLOW_ESCROW_ADDRESS } from '../escrow.contract'
import { shortAddr } from '../utils/hashing'
import {
  IconFileUpload,
  IconPaperclip,
  IconTrash,
  IconShieldLock,
} from '@tabler/icons-react'

const NAVY = '#0E2A55'

type EvidenceFile = {
  name: string
  type: string
  size: number
  dataUrl?: string
}

/* ---------- helpers ---------- */

function fmtBytes(n: number) {
  if (!Number.isFinite(n)) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

async function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(new Error('Failed to read file'))
    r.onload = () => resolve(String(r.result ?? ''))
    r.readAsDataURL(file)
  })
}

/* ---------- component ---------- */

export function EscrowEvidencePanel(props: {
  escrowPk: number
  escrowId: bigint
  address?: string
  canSubmit: boolean
  busy: boolean
  setBusy: (v: boolean) => void
  walletClient: any
  publicClient: any
}) {
  const { escrowPk, escrowId, address, canSubmit, busy, setBusy, walletClient, publicClient } = props

  const [note, setNote] = useState('')
  const [files, setFiles] = useState<EvidenceFile[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const tooLarge = useMemo(() => {
    const total = files.reduce((acc, f) => acc + (f.size || 0), 0)
    return total > 8 * 1024 * 1024
  }, [files])

  const [items, setItems] = useState<any[] | null>(null)
  const [loadingList, setLoadingList] = useState(false)

  async function refreshList() {
    setLoadingList(true)
    try {
      const out = await listEvidence(escrowPk)
      setItems(out ?? [])
    } catch (e: any) {
      toast.error(String(e?.message ?? e))
    } finally {
      setLoadingList(false)
    }
  }

  async function onPickFiles(fs: FileList | null) {
    if (!fs) return
    const next: EvidenceFile[] = []

    for (const f of Array.from(fs)) {
      const isSmall = f.size <= 600 * 1024
      let dataUrl: string | undefined

      if (isSmall) {
        try {
          dataUrl = await readAsDataUrl(f)
        } catch {}
      }

      next.push({
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
      })
    }

    setFiles((prev) => [...prev, ...next].slice(0, 6))
    if (inputRef.current) inputRef.current.value = ''
  }

  async function submitEvidence() {
    if (!address) return toast.error('Connect wallet')
    if (!canSubmit) return toast.error('Escrow must be funded')
    if (!walletClient || !publicClient) return toast.error('Wallet not ready')
    if (!ARCFLOW_ESCROW_ADDRESS || ARCFLOW_ESCROW_ADDRESS === zeroAddress) {
      return toast.error('Missing escrow contract')
    }
    if (tooLarge) return toast.error('Attachments too large')
    if (!note.trim() && files.length === 0) {
      return toast.error('Add a note or attach files')
    }

    setBusy(true)
    const tid = toast.loading('Saving evidence…')

    try {
      const created = await createEvidence({
        escrow: escrowPk,
        submitted_by_wallet: address,
        bundle: {
          note: note.trim(),
          created_at_client: new Date().toISOString(),
        },
        files: files.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
          dataUrl: f.dataUrl ?? null,
        })),
      })

      const evHash = created?.evidence_hash
      if (!evHash) throw new Error('Evidence hash missing')

      toast.loading('Submitting on-chain…', { id: tid })

      const txHash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'submitEvidence',
        args: [escrowId, evHash],
      })

      await publicClient.waitForTransactionReceipt({ hash: txHash })

      toast.success('Evidence submitted', { id: tid })
      setNote('')
      setFiles([])
      await refreshList()
    } catch (e: any) {
      toast.error(String(e?.message ?? e), { id: tid })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* SUBMIT EVIDENCE */}
      <Card className="rounded-2xl border border-subtle bg-surface-elevated p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconShieldLock size={18} style={{ color: NAVY }} />
            <h3 className="text-sm font-semibold text-ink-primary">Evidence</h3>
          </div>

          <button
            onClick={refreshList}
            className="text-xs font-medium text-ink-soft hover:text-ink-primary"
          >
            {loadingList ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <p className="mt-1 text-xs text-ink-soft">
          Attach files or notes. Stored off-chain, hash anchored on-chain.
        </p>

        <div className="mt-4 space-y-3">
          <textarea
            className="min-h-[90px] w-full rounded-xl border border-subtle bg-surface-sunken px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgba(14,42,85,0.15)]"
            placeholder="Add context, delivery notes, links, or explanations…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={!canSubmit || busy}
          />

          {/* FILE PICKER */}
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,application/pdf,text/plain,.json,.csv,.zip"
              onChange={(e) => onPickFiles(e.target.files)}
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={!canSubmit || busy}
              className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface-elevated px-3 py-2 text-xs font-medium disabled:opacity-50"
            >
              <IconPaperclip size={16} />
              Attach files
            </button>

            <span className="text-xs text-ink-soft">
              {files.length === 0 ? 'No attachments' : `${files.length} file(s)`}
              {tooLarge && <span className="ml-2 text-rose-600 font-semibold">Too large</span>}
            </span>
          </div>

          {/* FILE LIST */}
          {files.length > 0 && (
            <div className="rounded-xl border border-subtle bg-surface-sunken p-2 space-y-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-surface-elevated px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold">{f.name}</div>
                    <div className="text-[11px] text-ink-soft">
                      {fmtBytes(f.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded-lg p-2 hover:bg-surface-sunken"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={submitEvidence}
            disabled={!canSubmit || busy || tooLarge}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: NAVY }}
          >
            <IconFileUpload size={18} />
            Submit evidence
          </button>

          {!canSubmit && (
            <p className="text-[11px] text-ink-soft">
              Evidence can be submitted only after escrow is funded.
            </p>
          )}
        </div>
      </Card>

      {/* EVIDENCE HISTORY */}
      <Card className="rounded-2xl border border-subtle bg-surface-elevated p-4 shadow-soft">
        <h4 className="text-sm font-semibold text-ink-primary">Submitted evidence</h4>

        <div className="mt-3 space-y-2">
          {items == null ? (
            <p className="text-xs text-ink-soft">Click refresh to load evidence.</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-ink-soft">No evidence submitted yet.</p>
          ) : (
            items.slice().reverse().map((it: any) => (
              <div
                key={it.id}
                className="rounded-xl border border-subtle bg-surface-sunken p-3"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{shortAddr(it.submitted_by_wallet)}</span>
                  <span className="text-ink-soft">
                    {new Date(it.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="mt-1 text-[11px] text-ink-soft break-all">
                  hash: <span className="font-mono">{it.evidence_hash}</span>
                </div>

                {it.bundle?.note && (
                  <div className="mt-2 text-xs whitespace-pre-wrap">
                    {it.bundle.note}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
