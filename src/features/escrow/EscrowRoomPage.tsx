// src/features/escrow/EscrowRoomPage.tsx
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi'

import { Card } from '../../components/ui/Card'
import { ARC_CHAIN_ID } from '../../lib/config'
import { useEscrows } from './escrow.queries'
import { useTokens } from './chains.queries'
import { fetchChains } from './escrow.http'
import { readOnchainEscrow } from './utils/onchain'
import { shortAddr } from './utils/hashing'

import { EscrowTimeline } from './components/EscrowTimeline'
import { EscrowActions } from './components/EscrowActions'
import { EscrowChatPanel } from './components/EscrowChatPanel'
import { EscrowDetailsDrawer } from './components/EscrowDetailsDrawer'

import {
  IconArrowLeft,
  IconReload,
  IconMessageCircle2,
  IconTimeline,
  IconBolt,
  IconFileDescription,
  IconAlertTriangle,
  IconLock,
  IconCoins,
  IconUser,
  IconShieldCheck,
} from '@tabler/icons-react'

const NAVY = '#0E2A55'

// ✅ FIX: Dashboard lives on /dashboard, NOT /
const DASHBOARD_PATH = '/dashboard'

function statusLabel(onchainStatus: number | null, disputed: boolean) {
  if (disputed) return 'DISPUTED'
  if (onchainStatus === 0) return 'AWAITING DEPOSIT'
  if (onchainStatus === 1) return 'FUNDED'
  if (onchainStatus === 2) return 'RELEASED'
  if (onchainStatus === 3) return 'REFUNDED'
  return 'UNKNOWN'
}

function statusPill(label: string) {
  if (label.includes('RELEASED') || label.includes('REFUNDED'))
    return 'bg-emerald-300/15 text-emerald-100 ring-1 ring-emerald-200/25'
  if (label.includes('DISPUTED'))
    return 'bg-rose-300/15 text-rose-100 ring-1 ring-rose-200/25'
  if (label.includes('FUNDED'))
    return 'bg-sky-300/15 text-sky-100 ring-1 ring-sky-200/25'
  return 'bg-white/10 text-white ring-1 ring-white/15'
}

function InfoMini(props: { icon: any; label: string; value: string }) {
  const { icon: Icon, label, value } = props
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-2 ring-1 ring-white/15">
      <Icon size={14} stroke={1.9} className="text-white/80" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-white/65 leading-3">{label}</div>
        <div className="truncate text-[11px] font-semibold text-white leading-4">{value}</div>
      </div>
    </div>
  )
}

export function EscrowRoomPage() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const { escrowId } = useParams() as { escrowId?: string }

  const { address } = useAccount()
  const chainId = useChainId()
  const wrongChain = !!address && chainId !== ARC_CHAIN_ID

  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID })
  const { data: walletClient } = useWalletClient()

  const escrowsQ = useEscrows(address)

  const dbEscrow = useMemo(() => {
    const idNum = Number(escrowId)
    if (!Number.isFinite(idNum)) return null
    return (escrowsQ.data ?? []).find((e: any) => Number(e.escrow_id) === idNum) ?? null
  }, [escrowsQ.data, escrowId])

  const escrowPk = Number(dbEscrow?.id ?? 0)

  const escrowIdBig = useMemo(() => {
    const n = Number(dbEscrow?.escrow_id)
    return Number.isFinite(n) && n > 0 ? BigInt(n) : null
  }, [dbEscrow])

  const chainsQ = useQuery({
    queryKey: ['chains-list'],
    queryFn: fetchChains,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const tokensQ = useTokens()

  const arcChainDb = useMemo(
    () => (chainsQ.data ?? []).find((c: any) => c.chain_id === ARC_CHAIN_ID) ?? null,
    [chainsQ.data]
  )

  const arcTokens = useMemo(() => {
    if (!arcChainDb) return []
    return (tokensQ.data ?? [])
      .filter((t: any) => Number(t.chain) === arcChainDb.id && t.is_supported)
      .sort((a: any, b: any) => {
        const rank = (s: string) => (s === 'USDC' ? 0 : s === 'EURC' ? 1 : 2)
        return rank(a.symbol) - rank(b.symbol)
      })
  }, [tokensQ.data, arcChainDb])

  const onchainQ = useQuery({
    queryKey: ['onchain-escrow-room', escrowIdBig?.toString()],
    queryFn: () => readOnchainEscrow(publicClient, escrowIdBig as bigint),
    enabled: !!publicClient && !!escrowIdBig,
    refetchInterval: 6000,
    refetchOnWindowFocus: false,
  })

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const onchain = onchainQ.data ?? null
  const disputed = onchain ? onchain.disputed : !!dbEscrow?.disputed
  const label = statusLabel(onchain?.status ?? null, disputed)

  return (
    <section className="bg-[#F6F8FC]">
      <div className="mx-auto max-w-[1280px] px-4 py-4">
        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4">
            <div className="rounded-3xl bg-[#0E2A55] p-4 text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => nav(`${DASHBOARD_PATH}?tool=escrow`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-semibold ring-1 ring-white/15 hover:bg-white/15"
                >
                  <IconArrowLeft size={14} />
                  Back
                </button>

                <div className="text-sm font-semibold">
                  {dbEscrow ? `Escrow #${dbEscrow.escrow_id}` : 'Escrow Room'}
                </div>

                <span className={`ml-2 rounded-full px-2 py-1 text-[10px] ${statusPill(label)}`}>
                  {label}
                </span>
              </div>

              {wrongChain && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-200">
                  <IconAlertTriangle size={14} />
                  Wrong network. Switch to Arc Testnet.
                </div>
              )}
            </div>
          </div>

          <div className="px-4 pb-4">
            {!dbEscrow ? (
              <div className="rounded-xl border p-4 text-sm text-slate-600">Escrow not found.</div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-4">
                  <EscrowActions
                    e={dbEscrow}
                    address={address}
                    wrongChain={wrongChain}
                    tokensReady={arcTokens.length > 0}
                    arcTokens={arcTokens}
                    disputeFee={null}
                    busy={busy}
                    setBusy={setBusy}
                    walletClient={walletClient}
                    publicClient={publicClient}
                    onRefresh={async () => {
                      await escrowsQ.refetch()
                      qc.invalidateQueries({ queryKey: ['onchain-escrow-room'], exact: false })
                    }}
                    onchain={onchain}
                  />

                  <EscrowTimeline dbEscrow={dbEscrow} onchain={onchain} />
                </div>

                <div className="lg:col-span-5">
                  <EscrowChatPanel escrowPk={escrowPk} address={address} />
                </div>
              </div>
            )}
          </div>
        </Card>

        {dbEscrow && (
          <EscrowDetailsDrawer
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            escrow={dbEscrow}
            address={address}
            walletClient={walletClient}
          />
        )}
      </div>
    </section>
  )
}
