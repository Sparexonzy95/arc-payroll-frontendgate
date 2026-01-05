// src/features/escrow/EscrowTool.tsx
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi'
import { zeroAddress } from 'viem'

import { ARC_CHAIN_ID } from '../../lib/config'
import { useEscrows, useInvalidateEscrowQueries } from './escrow.queries'
import { useTokens } from './chains.queries'

import { arcflowEscrowAbi, ARCFLOW_ESCROW_ADDRESS } from './escrow.contract'
import { fetchChains } from './escrow.http'
import { prettyErr } from './utils/hashing'

import { CreateEscrowCard } from './components/CreateEscrowCard'
import { EscrowListCard } from './components/EscrowListCard'

async function readFeesBestEffort(
  publicClient: any
): Promise<{ creationFee: bigint; disputeFee: bigint | null }> {
  if (!publicClient) throw new Error('Public client not ready')
  if (!ARCFLOW_ESCROW_ADDRESS || ARCFLOW_ESCROW_ADDRESS === zeroAddress) {
    throw new Error('Missing VITE_ARCFLOW_ESCROW_ADDRESS')
  }

  const creationFee = (await publicClient.readContract({
    address: ARCFLOW_ESCROW_ADDRESS,
    abi: arcflowEscrowAbi,
    functionName: 'escrowCreationFee',
    args: [],
  })) as bigint

  let disputeFee: bigint | null = null
  try {
    disputeFee = (await publicClient.readContract({
      address: ARCFLOW_ESCROW_ADDRESS,
      abi: arcflowEscrowAbi,
      functionName: 'disputeFee',
      args: [],
    })) as bigint
  } catch {
    disputeFee = null
  }

  return { creationFee, disputeFee }
}

export function EscrowTool() {
  const qc = useQueryClient()
  const invalidateAll = useInvalidateEscrowQueries()

  const { address } = useAccount()
  const chainId = useChainId()

  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID })
  const { data: walletClient } = useWalletClient()

  const wrongChain = !!address && chainId !== ARC_CHAIN_ID
  const [busy, setBusy] = useState(false)

  const chainsQ = useQuery({
    queryKey: ['chains-list'],
    queryFn: fetchChains,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: true,
  })

  const tokensQ = useTokens()

  const arcChainDb = useMemo(() => {
    const list = chainsQ.data ?? []
    return list.find((c: any) => c.chain_id === ARC_CHAIN_ID) ?? null
  }, [chainsQ.data])

  const arcTokens: any[] = useMemo(() => {
    const list: any[] = tokensQ.data ?? []
    if (!arcChainDb) return []
    return list
      .filter((t) => Number(t.chain) === arcChainDb.id)
      .filter((t) => !!t.is_supported)
      .sort((a, b) => {
        const rank = (s: string) => (s === 'USDC' ? 0 : s === 'EURC' ? 1 : 2)
        return rank(String(a.symbol)) - rank(String(b.symbol))
      })
  }, [tokensQ.data, arcChainDb])

  const tokensReady = !!arcChainDb && !tokensQ.isLoading && arcTokens.length > 0
  const escrowsQ = useEscrows(address)

  const [creationFee, setCreationFee] = useState<bigint | null>(null)
  const [disputeFee, setDisputeFee] = useState<bigint | null>(null)
  const [feeErr, setFeeErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setFeeErr(null)
      setCreationFee(null)
      setDisputeFee(null)

      if (!publicClient) return
      if (!ARCFLOW_ESCROW_ADDRESS || ARCFLOW_ESCROW_ADDRESS === zeroAddress) {
        setFeeErr('Missing VITE_ARCFLOW_ESCROW_ADDRESS')
        return
      }

      try {
        const fees = await readFeesBestEffort(publicClient)
        if (cancelled) return
        setCreationFee(fees.creationFee)
        setDisputeFee(fees.disputeFee ?? null)
      } catch (e: any) {
        if (cancelled) return
        setFeeErr(prettyErr(e))
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [publicClient])

  async function refreshAll() {
    invalidateAll()
    qc.invalidateQueries({ queryKey: ['escrows'], exact: false })
    await escrowsQ.refetch()
  }

  return (
    <section className="bg-[#F6F8FC]">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6">
        {/* Professional grid rhythm */}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* Left: control panel (sticky) */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-6">
              <CreateEscrowCard
                address={address}
                wrongChain={wrongChain}
                busy={busy}
                setBusy={setBusy}
                arcTokens={arcTokens}
                tokensReady={tokensReady}
                arcChainDbReady={!!arcChainDb}
                creationFee={creationFee}
                walletClient={walletClient}
                publicClient={publicClient}
                onRefresh={refreshAll}
              />
              {/* keep available for debugging */}
              {/* {feeErr ? <div className="mt-2 text-xs text-rose-600">{feeErr}</div> : null} */}
            </div>
          </div>

          {/* Right: primary workspace */}
          <div className="lg:col-span-8">
            <EscrowListCard
              escrows={(escrowsQ.data ?? []) as any[]}
              isLoading={escrowsQ.isLoading}
              isError={escrowsQ.isError}
              onRefreshClick={() => escrowsQ.refetch()}
              address={address}
              wrongChain={wrongChain}
              tokensReady={tokensReady}
              arcTokens={arcTokens}
              disputeFee={disputeFee}
              busy={busy}
              setBusy={setBusy}
              walletClient={walletClient}
              publicClient={publicClient}
              onRefresh={refreshAll}
              chainId={chainId}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
