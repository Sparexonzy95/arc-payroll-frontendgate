// src/hooks/useUsdcBalance.ts
import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { ARC_CHAIN_ID, BASE_CHAIN_ID } from '../../lib/config'

const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [ARC_CHAIN_ID]: '0x3600000000000000000000000000000000000000',
  [BASE_CHAIN_ID]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
}

/**
 * Read USDC ERC-20 balance for a wallet on a given chain.
 * Returns raw bigint and human-readable number (6 decimals).
 */
export function useUsdcBalance(
  address: `0x${string}` | undefined,
  chainId: number
) {
  const tokenAddress = USDC_ADDRESSES[chainId]

  const { data, isLoading, isError } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: {
      enabled: !!address && !!tokenAddress
    }
  })

  const raw = data as bigint | undefined
  const formatted = raw ? Number(raw) / 1_000_000 : 0 // USDC = 6 decimals

  return {
    raw,
    formatted,
    isLoading,
    isError
  }
}
