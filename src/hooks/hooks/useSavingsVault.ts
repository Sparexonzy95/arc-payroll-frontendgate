// src/hooks/hooks/useSavingsVault.ts
import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits } from 'viem'
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

function readTokenFromSavingStruct(s: any): `0x${string}` {
  return (s?.token ?? s?.[1]) as `0x${string}`
}

function readPlanTypeFromSavingStruct(s: any): number | null {
  const raw = s?.planType ?? s?.[2]
  if (raw === undefined || raw === null) return null
  try {
    return Number(raw)
  } catch {
    return null
  }
}

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
  // Read saving struct once (for token + planType)
  // --------------------------------------------------
  async function readSavingStruct(savingId: bigint) {
    const savingStruct = await publicClient.readContract({
      address: ARC_SAVINGS_VAULT,
      abi: savingsVaultAbi,
      functionName: 'savings',
      args: [savingId],
    })
    return savingStruct as any
  }

  // --------------------------------------------------
  // Approve token if allowance < needed
  // --------------------------------------------------
  async function ensureAllowanceForSaving(savingId: bigint, amountAtomic: bigint) {
    if (amountAtomic === 0n) return

    const savingStruct = await readSavingStruct(savingId)
    const tokenAddress = readTokenFromSavingStruct(savingStruct)

    console.log('SV_ALLOWANCE_CHECK', {
      savingId: savingId.toString(),
      tokenAddress,
      spender: ARC_SAVINGS_VAULT,
      account: address,
      amountAtomic: amountAtomic.toString(),
    })

    const currentAllowance = (await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address as `0x${string}`, ARC_SAVINGS_VAULT],
    })) as bigint

    console.log('SV_ALLOWANCE_CURRENT', {
      currentAllowance: currentAllowance.toString(),
    })

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

    console.log('SV_APPROVE_TX', approveHash)

    const approveReceipt = await publicClient.waitForTransactionReceipt({
      hash: approveHash,
    })

    toast.dismiss('sv-approve')
    checkReceiptOk(approveReceipt, 'Token approval')
    toast.success('Token approval confirmed.')
  }

  // --------------------------------------------------
  // createSaving: returns the on-chain savingId
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

      console.log('SV_CREATE_TX', hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      checkReceiptOk(receipt, 'Create saving')
      toast.dismiss('sv-create')

      const nextSavingId = (await publicClient.readContract({
        address: ARC_SAVINGS_VAULT,
        abi: savingsVaultAbi,
        functionName: 'nextSavingId',
      })) as bigint

      const createdId = nextSavingId - 1n
      console.log('SV_CREATE_DONE', { createdId: createdId.toString() })
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

      // USDC / EURC = 6 decimals
      const atomic = parseUnits(amount, 6)

      console.log('DEPOSIT_CALL', {
        savingId: savingId.toString(),
        amountHuman: amount,
        amountAtomic: atomic.toString(),
        chainId: ARC_CHAIN_ID,
        vault: ARC_SAVINGS_VAULT,
        account: address,
      })

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

      console.log('DEPOSIT_TX_HASH', hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('DEPOSIT_RECEIPT', receipt)
      toast.dismiss('sv-deposit')

      checkReceiptOk(receipt, 'Deposit')
      toast.success('Deposit confirmed on-chain.')
      console.log('DEPOSIT_CONFIRMED', { savingId: savingId.toString() })
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

      // Safety guard: ensure this saving is flex ON-CHAIN
      const savingStruct = await readSavingStruct(savingId)
      const planType = readPlanTypeFromSavingStruct(savingStruct)

      if (planType !== null && planType !== 0) {
        // This prevents "not flex" revert + gas waste
        throw new Error('This saving is not a flex plan')
      }

      const atomic = parseUnits(amount, 6)

      console.log('WITHDRAW_FLEX_CALL', {
        savingId: savingId.toString(),
        amountHuman: amount,
        amountAtomic: atomic.toString(),
        chainId: ARC_CHAIN_ID,
        vault: ARC_SAVINGS_VAULT,
        account: address,
      })

      toast.loading('Withdrawing from flex saving…', { id: 'sv-wflex' })

      const hash = await walletClient!.writeContract({
        address: ARC_SAVINGS_VAULT,
        abi: savingsVaultAbi,
        functionName: 'withdrawFlex',
        args: [savingId, atomic],
        account: address,
        chainId: ARC_CHAIN_ID,
      })

      console.log('WITHDRAW_FLEX_TX_HASH', hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('WITHDRAW_FLEX_RECEIPT', receipt)
      toast.dismiss('sv-wflex')

      checkReceiptOk(receipt, 'Flex withdrawal')
      toast.success('Flex withdrawal confirmed.')
    } catch (err: any) {
      toast.dismiss('sv-wflex')
      console.error('withdrawFlex failed', err)
      // show nicer message if it’s our guard
      if (String(err?.message || '').toLowerCase().includes('not a flex')) {
        toast.error('This saving is fixed, use Withdraw fixed.')
      }
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

      console.log('WITHDRAW_FIXED_CALL', {
        savingId: savingId.toString(),
        chainId: ARC_CHAIN_ID,
        vault: ARC_SAVINGS_VAULT,
        account: address,
      })

      toast.loading('Withdrawing fixed saving…', { id: 'sv-wfixed' })

      const hash = await walletClient!.writeContract({
        address: ARC_SAVINGS_VAULT,
        abi: savingsVaultAbi,
        functionName: 'withdrawFixed',
        args: [savingId],
        account: address,
        chainId: ARC_CHAIN_ID,
      })

      console.log('WITHDRAW_FIXED_TX_HASH', hash)

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('WITHDRAW_FIXED_RECEIPT', receipt)
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
