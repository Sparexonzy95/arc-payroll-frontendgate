import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { zeroAddress } from 'viem'
import { Card } from '../../../components/ui/Card'
import { createEvidence, listEvidence } from '../escrow.api'
import { arcflowEscrowAbi, ARCFLOW_ESCROW_ADDRESS } from '../escrow.contract'
import { shortAddr } from '../utils/hashing'
import { IconFileUpload, IconPaperclip, IconTrash, IconShieldLock } from '@tabler/icons-react'

const NAVY = '#0E2A55'

type EvidenceFile = {
  name: string
  type: string
  size: number
  dataUrl?: string // base64 for small files
}

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
    return total > 8 * 1024 * 1024 // 8MB soft cap for JSON payload
  }, [files])

  // lightweight list (no react-query dependency here, keeps this file drop-in safe)
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
    if (!fs || fs.length === 0) return
    const next: EvidenceFile[] = []
    for (const f of Array.from(fs)) {
      // keep it sane: store base64 only for small files
      const isSmall = f.size <= 600 * 1024 // 600KB
      let dataUrl: string | undefined
      if (isSmall) {
        try {
          dataUrl = await readAsDataUrl(f)
        } catch {
          dataUrl = undefined
        }
      }
      next.push({ name: f.name, type: f.type || 'application/octet-stream', size: f.size, dataUrl })
    }
    setFiles((prev) => [...prev, ...next].slice(0, 6)) // max 6 attachments
    if (inputRef.current) inputRef.current.value = ''
  }

  async function submitEvidence() {
    if (!address) return toast.error('Connect wallet')
    if (!canSubmit) return toast.error('Evidence can be submitted only when escrow is funded.')
    if (!walletClient || !publicClient) return toast.error('Wallet not ready')
    if (!ARCFLOW_ESCROW_ADDRESS || ARCFLOW_ESCROW_ADDRESS === zeroAddress) {
      return toast.error('Missing VITE_ARCFLOW_ESCROW_ADDRESS')
    }
    if (tooLarge) return toast.error('Attachments are too large. Remove some files.')
    if (!note.trim() && files.length === 0) return toast.error('Add a note or attach at least one file.')

    setBusy(true)
    const tid = toast.loading('Saving evidence…')

    try {
      // 1) Save to backend, get evidence_hash back
      const created = await createEvidence({
        escrow: escrowPk,
        submitted_by_wallet: address,
        bundle: {
          note: note.trim(),
          created_at_client: new Date().toISOString(),
          hint: 'Evidence bundle for dispute resolution',
        },
        files: files.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
          // Only present for small files
          dataUrl: f.dataUrl ?? null,
        })),
      })

      const evHash = created?.evidence_hash as `0x${string}` | string
      if (!evHash) throw new Error('Evidence hash not returned from backend')

      toast.loading('Submitting evidence on-chain…', { id: tid })

      // 2) Post hash to chain
      const txHash = await walletClient.writeContract({
        address: ARCFLOW_ESCROW_ADDRESS,
        abi: arcflowEscrowAbi,
        functionName: 'submitEvidence',
        args: [escrowId, evHash],
      })

      toast.loading(`Waiting confirmation… ${shortAddr(txHash)}`, { id: tid })
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      if (receipt.status !== 'success') throw new Error('Transaction failed')

      toast.success('Evidence submitted ✅', { id: tid })
      setNote('')
      setFiles([])
      await refreshList()
    } catch (e: any) {
      toast.error(String(e?.message ?? e), { id: tid })
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <Card className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <IconShieldLock size={16} stroke={1.9} style={{ color: NAVY }} />
              <div className="text-sm font-semibold text-slate-900">Evidence</div>
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              Add files, notes, receipts, screenshots. Stored in backend, hash posted on-chain.
            </div>
          </div>

          <button
            type="button"
            onClick={refreshList}
            className="rounded-xl border border-slate-200 bg-[#F6F8FC] px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            {loadingList ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <label className="block">
            <div className="text-[11px] font-semibold text-slate-600">Note</div>
            <textarea
              className="mt-1 min-h-[70px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="What happened? Add context, links, delivery notes…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!canSubmit || busy}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              multiple
              onChange={(e) => onPickFiles(e.target.files)}
              className="hidden"
              accept="image/*,application/pdf,text/plain,.json,.csv,.zip"
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={!canSubmit || busy}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              <IconPaperclip size={16} stroke={1.9} style={{ color: NAVY }} />
              Attach files
            </button>

            <div className="text-xs text-slate-600">
              {files.length === 0 ? 'No attachments' : `${files.length} file(s)`}
              {tooLarge ? <span className="ml-2 font-semibold text-rose-600">Too large</span> : null}
            </div>
          </div>

          {files.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-[#F6F8FC] p-2">
              <div className="space-y-2">
                {files.map((f, idx) => (
                  <div key={`${f.name}-${idx}`} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-900">{f.name}</div>
                      <div className="text-[11px] text-slate-600">
                        {f.type} • {fmtBytes(f.size)} {f.dataUrl ? '• embedded' : '• metadata'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                      title="Remove"
                    >
                      <IconTrash size={16} stroke={1.9} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={submitEvidence}
            disabled={!canSubmit || busy || tooLarge}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: NAVY }}
          >
            <IconFileUpload size={18} stroke={1.9} />
            Submit evidence
          </button>

          {!canSubmit && (
            <div className="text-[11px] text-slate-500">
              Evidence becomes available after the escrow is funded (tokens locked).
            </div>
          )}
        </div>
      </Card>

      <Card className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Submitted evidence</div>

        <div className="mt-2 space-y-2">
          {items == null ? (
            <div className="text-xs text-slate-600">Click “Refresh” to load evidence history.</div>
          ) : items.length === 0 ? (
            <div className="text-xs text-slate-600">No evidence submitted yet.</div>
          ) : (
            items.slice().reverse().map((it: any) => (
              <div key={it.id} className="rounded-xl border border-slate-200 bg-[#F6F8FC] p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-900">
                    {it.submitted_by_wallet ? shortAddr(it.submitted_by_wallet) : '—'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {it.created_at ? new Date(it.created_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-slate-700 break-all">
                  hash: <span className="font-semibold">{it.evidence_hash ?? '—'}</span>
                </div>
                {it.bundle?.note ? (
                  <div className="mt-1 whitespace-pre-wrap text-xs text-slate-700">{String(it.bundle.note)}</div>
                ) : null}
                {Array.isArray(it.files) && it.files.length > 0 ? (
                  <div className="mt-2 text-[11px] text-slate-600">
                    attachments: <span className="font-semibold">{it.files.length}</span>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
