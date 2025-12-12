// src/hooks/usePayrollManager.ts
import { useWriteContract, useChainId } from 'wagmi'
import {
  ARC_CHAIN_ID,
  BASE_CHAIN_ID,
  ARC_PAYROLL_MANAGER,
  BASE_PAYROLL_MANAGER
} from '../../lib/config'

const PAYROLL_MANAGER_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'payrollId', type: 'uint256' },
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'fundPayroll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

type FundParams = {
  payrollId: number
  token: `0x${string}`
  amount: bigint
}

function resolveManagerAddress(chainId: number | undefined): `0x${string}` | null {
  if (!chainId) return null
  if (chainId === ARC_CHAIN_ID) return ARC_PAYROLL_MANAGER
  if (chainId === BASE_CHAIN_ID) return BASE_PAYROLL_MANAGER
  return null
}

export function usePayrollManager() {
  const chainId = useChainId()
  const { writeContractAsync, status, error } = useWriteContract()

  async function fundPayroll(params: FundParams) {
    const manager = resolveManagerAddress(chainId)
    if (!manager) {
      throw new Error('Unsupported chain for PayrollManager')
    }

    const { payrollId, token, amount } = params

    return writeContractAsync({
      address: manager,
      abi: PAYROLL_MANAGER_ABI,
      functionName: 'fundPayroll',
      args: [BigInt(payrollId), token, amount]
    })
  }

  return { fundPayroll, status, error }
}
