// src/hooks/useSavingsVault.ts
import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { decodeEventLog, parseUnits } from 'viem'
import toast from 'react-hot-toast'

import { ARC_CHAIN_ID, ARC_SAVINGS_VAULT } from '../../lib/config'
import { savingsVaultAbi } from '../../abi/savingsVault'

type PlanType = 'flex' | 'fixed'

interface CreateSavingArgs {
  token: `0x${string}`
  planType: PlanType
  // unix seconds, optional for flex
  maturesAt?: number
}

interface DepositArgs {
  savingId: bigint
  amount: string // human, e.g. "0.01"
}

interface WithdrawFlexArgs {
  savingId: bigint
  amount: string // human, e.g. "0.01"
}

// minimal ERC20 ABI: allowance + approve
const erc20Abi = [
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

export function useSavingsVault() {
  const { address, chainId } = useAccount()
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID })
  const { data: walletClient } = useWalletClient()

  const [loading, setLoading] = useState(false)

  function ensureWallet() {
    if (!address) {
      toast.error('Connect your wallet first.')
      throw new Error('Wallet not connected')
    }
    if (!walletClient) {
      toast.error('Wallet client not ready.')
      throw new Error('Wallet client not ready')
    }
  }

  async function ensureArcChain() {
    if (chainId !== ARC_CHAIN_ID) {
      toast.error('Switch your wallet to Arc Testnet.')
      throw new Error(`Wrong network: expected ${ARC_CHAIN_ID}, got ${chainId}`)
    }
  }

  function checkReceiptOk(receipt: any, label: string) {
    const status = receipt?.status
    const ok = status === 'success' || status === 1n || status === 1
    if (!ok) {
      console.error(`${label} reverted`, receipt)
      toast.error(`${label} transaction reverted on-chain.`)
      throw new Error(`${label} reverted`)
    }
  }

  // --------------------------------------------------
  // Approve token if allowance < needed
  // --------------------------------------------------
  async function ensureAllowanceForSaving(savingId: bigint, amountAtomic: bigint) {
    if (amountAtomic === 0n) return

    const savingStruct = await publicClient.readContract({
      address: ARC_SAVINGS_VAULT,
      abi: savingsVaultAbi,
      functionName: 'savings',
      args: [savingId],
    })

    const sAny = savingStruct as any
    const tokenAddress = (sAny.token ?? sAny[1]) as `0x${string}`

    const currentAllowance = (await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address as `0x${string}`, ARC_SAVINGS_VAULT],
    })) as bigint

    if (currentAllowance >= amountAtomic) return

    toast.loading('Approving vault to spend your tokens…', { id: 'sv-approve' })

    const approveHash = await walletClient!.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ARC_SAVINGS_VAULT, amountAtomic],
      account: address,
      chainId: ARC_CHAIN_ID,
    })

    const approveReceipt = await publicClient.waitForTransactionReceipt({
      hash: approveHash,
    })

    toast.dismiss('sv-approve')
    checkReceiptOk(approveReceipt, 'Token approval')
    toast.success('Token approval confirmed.')
  }

  // --------------------------------------------------
  // createSaving: returns the on-chain savingId
  // FIX: extract savingId from SavingCreated event
  // --------------------------------------------------
  async function createSaving(args: CreateSavingArgs): Promise<bigint> {
    const { token, planType, maturesAt } = args
    ensureWallet()

    try {
      setLoading(true)
      await ensureArcChain()

      const planTypeEnum = planType === 'flex' ? 0 : 1
      const maturesAtUint = BigInt(maturesAt ?? 0)

      toast.loading('Creating saving on-chain…', { id: 'sv-create' })

      const hash = await walletClient!.writeContract({
        address: ARC_SAVINGS_VAULT,
        abi: savingsVaultAbi,
        functionName: 'createSaving',
        args: [token, planTypeEnum, maturesAtUint],
        account: address,
        chainId: ARC_CHAIN_ID,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      toast.dismiss('sv-create')
      checkReceiptOk(receipt, 'Create saving')

      // Decode SavingCreated(savingId, owner, token, planType, createdAt, maturesAt)
      let createdId: bigint | null = null

      for (const log of receipt.logs ?? []) {
        try {
          const decoded = decodeEventLog({
            abi: savingsVaultAbi,
            data: log.data,
            topics: log.topics as any,
          })

          if (decoded.eventName === 'SavingCreated') {
            const savingId = (decoded.args as any).savingId as bigint
            createdId = savingId
            break
          }
        } catch {
          // ignore non-matching logs
        }
      }

      if (createdId === null) {
        throw new Error('Could not find SavingCreated event. Cannot determine savingId.')
      }

      toast.success(`Saving #${createdId.toString()} created.`)
      return createdId
    } catch (err) {
      toast.dismiss('sv-create')
      console.error('createSaving failed', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // deposit into existing saving
  // --------------------------------------------------
  async function deposit(args: DepositArgs): Promise<void> {
    const { savingId, amount } = args
    ensureWallet()

    if (!amount) {
      toast.error('Enter an amount to deposit.')
      throw new Error('Amount missing')
    }

    try {
      setLoading(true)
      await ensureArcChain()

      const atomic = parseUnits(amount, 6)

      await ensureAllowanceForSaving(savingId, atomic)

      toast.loading('Depositing into saving…', { id: 'sv-deposit' })

      const hash = await walletClient!.writeContract({
        address: ARC_SAVINGS_VAULT,
        abi: savingsVaultAbi,
        functionName: 'deposit',
        args: [savingId, atomic],
        account: address,
        chainId: ARC_CHAIN_ID,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      toast.dismiss('sv-deposit')

      checkReceiptOk(receipt, 'Deposit')
      toast.success('Deposit confirmed on-chain.')
    } catch (err) {
      toast.dismiss('sv-deposit')
      console.error('deposit failed', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // withdraw from flex saving
  // --------------------------------------------------
  async function withdrawFlex(args: WithdrawFlexArgs): Promise<void> {
    const { savingId, amount } = args
    ensureWallet()

    if (!amount) {
      toast.error('Enter an amount to withdraw.')
      throw new Error('Amount missing')
    }

    try {
      setLoading(true)
      await ensureArcChain()

      const atomic = parseUnits(amount, 6)

      toast.loading('Withdrawing from flex saving…', { id: 'sv-wflex' })

      const hash = await walletClient!.writeContract({
        address: ARC_SAVINGS_VAULT,
        abi: savingsVaultAbi,
        functionName: 'withdrawFlex',
        args: [savingId, atomic],
        account: address,
        chainId: ARC_CHAIN_ID,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      toast.dismiss('sv-wflex')

      checkReceiptOk(receipt, 'Flex withdrawal')
      toast.success('Flex withdrawal confirmed.')
    } catch (err) {
      toast.dismiss('sv-wflex')
      console.error('withdrawFlex failed', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // withdraw fixed saving (all, subject to maturity)
  // --------------------------------------------------
  async function withdrawFixed(savingId: bigint): Promise<void> {
    ensureWallet()

    try {
      setLoading(true)
      await ensureArcChain()

      toast.loading('Withdrawing fixed saving…', { id: 'sv-wfixed' })

      const hash = await walletClient!.writeContract({
        address: ARC_SAVINGS_VAULT,
        abi: savingsVaultAbi,
        functionName: 'withdrawFixed',
        args: [savingId],
        account: address,
        chainId: ARC_CHAIN_ID,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      toast.dismiss('sv-wfixed')

      checkReceiptOk(receipt, 'Fixed withdrawal')
      toast.success('Fixed withdrawal confirmed.')
    } catch (err) {
      toast.dismiss('sv-wfixed')
      console.error('withdrawFixed failed', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createSaving,
    deposit,
    withdrawFlex,
    withdrawFixed,
  }
}
