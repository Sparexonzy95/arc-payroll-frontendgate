// src/features/escrow/escrow.contract.ts
import { isAddress, zeroAddress } from 'viem'
import ArcflowEscrowArtifact from '../../abi/ArcflowEscrow.json'

const RAW_ESCROW = String(((import.meta as any).env?.VITE_ARCFLOW_ESCROW_ADDRESS ?? '') as string).trim()

export const ARCFLOW_ESCROW_ADDRESS = (isAddress(RAW_ESCROW) ? RAW_ESCROW : zeroAddress) as `0x${string}`

// Fixed arbiter wallet
export const ARCFLOW_ARBITER_WALLET =
  '0x0EdBC6F8506e72478CE78a4AE934C7b21cb7050A' as const

/**
 * ABI loader supports BOTH:
 * - Hardhat artifact: { abi: [...] }
 * - Raw ABI array:    [ ... ]
 */
const _artifact: any = ArcflowEscrowArtifact as any
export const arcflowEscrowAbi = (_artifact?.abi ?? _artifact) as const

// Dev guard: makes ABI problems obvious immediately
if (import.meta?.env?.DEV) {
  const ok = Array.isArray(arcflowEscrowAbi) && arcflowEscrowAbi.length > 0
  if (!ok) {
    // eslint-disable-next-line no-console
    console.error(
      'ArcflowEscrow ABI not loaded. Fix src/abi/ArcflowEscrow.json (must be {abi:[...]} or [...]).'
    )
  }
}

export const erc20Abi = [
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const
