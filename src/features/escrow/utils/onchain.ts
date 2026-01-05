// src/features/escrow/utils/onchain.ts
import type { Hex } from 'viem'
import { arcflowEscrowAbi, ARCFLOW_ESCROW_ADDRESS } from '../escrow.contract'

export type OnchainEscrow = {
  payer: string
  payee: string
  token: string
  amount: bigint
  arbiter: string
  termsHash: Hex

  status: number // 0 awaiting, 1 funded, 2 released, 3 refunded
  disputed: boolean

  createdAt: number
  fundedAt: number
  timeoutSeconds: number

  payerApprovedRelease: boolean
  payeeApprovedRelease: boolean
  payerApprovedRefund: boolean
  payeeApprovedRefund: boolean

  payerEvidenceHash: Hex
  payeeEvidenceHash: Hex
}

export async function readOnchainEscrow(publicClient: any, escrowId: bigint): Promise<OnchainEscrow> {
  const data = await publicClient.readContract({
    address: ARCFLOW_ESCROW_ADDRESS,
    abi: arcflowEscrowAbi,
    functionName: 'escrows',
    args: [escrowId],
  })

  const out = data as any[]

  return {
    payer: out[0],
    payee: out[1],
    token: out[2],
    amount: out[3],
    arbiter: out[4],
    termsHash: out[5],

    status: Number(out[6]),
    disputed: Boolean(out[7]),

    createdAt: Number(out[8]),
    fundedAt: Number(out[9]),
    timeoutSeconds: Number(out[10]),

    payerApprovedRelease: Boolean(out[11]),
    payeeApprovedRelease: Boolean(out[12]),
    payerApprovedRefund: Boolean(out[13]),
    payeeApprovedRefund: Boolean(out[14]),

    payerEvidenceHash: out[15],
    payeeEvidenceHash: out[16],
  }
}
