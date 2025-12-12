// src/features/gateway/GatewayDepositForm.tsx

import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits } from 'viem'
import toast from 'react-hot-toast'

// UI components
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

// Icons
import { ArrowDownToLine, Wallet, Coins } from 'lucide-react'

// Config
import { ARC_CHAIN_ID, BASE_CHAIN_ID } from '../../lib/config'

const GATEWAY_WALLET_ADDRESS =
  '0x0077777d7EBA4688BDeF3E311b846F25870A19B9'

const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [BASE_CHAIN_ID]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  [ARC_CHAIN_ID]: '0x3600000000000000000000000000000000000000',
}

// Minimal ABI
const ERC20_ABI = [
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
]

const GATEWAY_WALLET_ABI = [
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
  },
]

export function GatewayDepositForm() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [amount, setAmount] = useState('')
  const [isDepositingBase, setIsDepositingBase] = useState(false)
  const [isDepositingArc, setIsDepositingArc] = useState(false)

  const disabled = !address || !walletClient || !publicClient || !amount

  async function handleDeposit(targetChainId: number) {
    if (!walletClient || !publicClient) {
      toast.error('Wallet client not available.')
      return
    }

    if (!amount) {
      toast.error('Enter an amount.')
      return
    }

    const usdcAddress = USDC_ADDRESSES[targetChainId]
    if (!usdcAddress) {
      toast.error('USDC address not configured.')
      return
    }

    const setLoading =
      targetChainId === BASE_CHAIN_ID
        ? setIsDepositingBase
        : setIsDepositingArc

    try {
      setLoading(true)

      // switch chain
      if (walletClient.switchChain) {
        // @ts-ignore wagmi types
        await walletClient.switchChain({ id: targetChainId })
      }

      const value = parseUnits(amount, 6)

      // approve
      toast.loading('Approving USDC...', { id: 'gw-deposit' })
      const approveTx = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [GATEWAY_WALLET_ADDRESS, value],
      })

      await publicClient.waitForTransactionReceipt({ hash: approveTx })

      // deposit
      toast.loading('Depositing into Gateway...', { id: 'gw-deposit' })
      const depositTx = await walletClient.writeContract({
        address: GATEWAY_WALLET_ADDRESS,
        abi: GATEWAY_WALLET_ABI,
        functionName: 'deposit',
        args: [usdcAddress, value],
      })

      await publicClient.waitForTransactionReceipt({ hash: depositTx })

      toast.success('Deposit complete.', { id: 'gw-deposit' })
    } catch (err: any) {
      console.error(err)
      toast.error(err?.shortMessage || err?.message || 'Deposit failed.', {
        id: 'gw-deposit',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="relative rounded-2xl border border-subtle bg-surface-elevated p-0 shadow-soft">
      {/* Glow accents */}
      <div className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full bg-[#1a5bab]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-4 right-0 h-20 w-20 rounded-full bg-[#4189e1]/30 blur-2xl" />

      {/* FULL-WIDTH INNER WRAPPER */}
      <div className="flex w-full flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4189e1]/20 ring-1 ring-[#4189e1]/45">
            <ArrowDownToLine className="h-6 w-6 text-[#e3eefa]" />
          </div>

          <div>
            <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-ink-primary">
              Deposit into Gateway
            </h3>
            <p className="text-xs text-ink-soft">
              Move USDC from your wallet to your Gateway balance.
            </p>
          </div>
        </div>

        {/* Amount input */}
        <Input
          label="Amount (USDC)"
          placeholder="10.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!address}
          className="text-sm"
        />

        {/* Buttons */}
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
          <Button
            type="button"
            variant="primary"
            loading={isDepositingBase}
            disabled={disabled || isDepositingArc}
            onClick={() => handleDeposit(BASE_CHAIN_ID)}
            className="flex w-full items-center justify-center gap-2"
          >
            <Coins className="h-4 w-4" />
            Deposit from Base
          </Button>

          <Button
            type="button"
            variant="secondary"
            loading={isDepositingArc}
            disabled={disabled || isDepositingBase}
            onClick={() => handleDeposit(ARC_CHAIN_ID)}
            className="flex w-full items-center justify-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            Deposit from Arc
          </Button>
        </div>

        {!address && (
          <p className="text-xs text-ink-soft">
            Connect your wallet to deposit USDC.
          </p>
        )}
      </div>
    </Card>
  )
}
