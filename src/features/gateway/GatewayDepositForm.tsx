// src/features/gateway/GatewayDepositForm.tsx
import { useMemo, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits } from 'viem'
import toast from 'react-hot-toast'

import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

import { IconArrowDownToArc, IconWallet, IconCoin } from '@tabler/icons-react'
import { ARC_CHAIN_ID, BASE_CHAIN_ID } from '../../lib/config'
import { IconBadge, isValidPositiveAmount } from './_shared'

const GATEWAY_WALLET_ADDRESS = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9'

const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [BASE_CHAIN_ID]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  [ARC_CHAIN_ID]: '0x3600000000000000000000000000000000000000',
}

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
] as const

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
] as const

export function GatewayDepositForm() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [amount, setAmount] = useState('')
  const [isDepositingBase, setIsDepositingBase] = useState(false)
  const [isDepositingArc, setIsDepositingArc] = useState(false)

  const validAmount = useMemo(() => isValidPositiveAmount(amount), [amount])
  const disabled = !address || !walletClient || !publicClient || !validAmount

  async function handleDeposit(targetChainId: number) {
    if (!walletClient || !publicClient) {
      toast.error('Wallet client not available.')
      return
    }
    if (!validAmount) {
      toast.error('Enter a valid amount greater than zero.')
      return
    }

    const usdcAddress = USDC_ADDRESSES[targetChainId]
    if (!usdcAddress) {
      toast.error('USDC address not configured.')
      return
    }

    const setLoading = targetChainId === BASE_CHAIN_ID ? setIsDepositingBase : setIsDepositingArc
    const toastId = `gw-deposit-${targetChainId}`

    try {
      setLoading(true)

      if (walletClient.switchChain) {
        // @ts-ignore wagmi types
        await walletClient.switchChain({ id: targetChainId })
      }

      const value = parseUnits(amount.trim(), 6)

      toast.loading('Approving USDC...', { id: toastId })
      const approveTx = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [GATEWAY_WALLET_ADDRESS, value],
      })
      await publicClient.waitForTransactionReceipt({ hash: approveTx })

      toast.loading('Depositing into Gateway...', { id: toastId })
      const depositTx = await walletClient.writeContract({
        address: GATEWAY_WALLET_ADDRESS as `0x${string}`,
        abi: GATEWAY_WALLET_ABI,
        functionName: 'deposit',
        args: [usdcAddress, value],
      })
      await publicClient.waitForTransactionReceipt({ hash: depositTx })

      toast.success('Deposit complete.', { id: toastId })
      setAmount('')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.shortMessage || err?.message || 'Deposit failed.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="relative rounded-2xl border border-subtle bg-surface-elevated p-0">
      <div
        className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full blur-3xl"
        style={{ background: 'var(--arc-primary-muted)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-5 right-0 h-20 w-20 rounded-full blur-2xl"
        style={{ background: 'rgba(37, 99, 235, 0.10)' }}
      />

      <div className="flex w-full flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        <div className="flex items-start gap-3">
          <IconBadge>
            <IconArrowDownToArc size={18} stroke={2} />
          </IconBadge>

          <div className="min-w-0">
            <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-ink-primary">
              Deposit from wallet → Gateway
            </h3>
            <p className="mt-1 text-xs text-ink-soft">Move USDC from your wallet to your Gateway balance.</p>
          </div>
        </div>

        <Input
          label="Amount (USDC)"
          placeholder="10.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!address}
          className="text-sm"
          helperText={!amount ? 'Enter an amount to deposit.' : !validAmount ? 'Amount must be a valid number > 0.' : undefined}
        />

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="primary"
            loading={isDepositingBase}
            disabled={disabled || isDepositingArc}
            onClick={() => handleDeposit(BASE_CHAIN_ID)}
            className="flex w-full items-center justify-center gap-2"
          >
            <IconCoin size={18} stroke={2} />
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
            <IconWallet size={18} stroke={2} />
            Deposit from Arc
          </Button>
        </div>

        {!address && <p className="text-xs text-ink-soft">Connect your wallet to deposit USDC.</p>}

        <div className="rounded-xl border border-subtle bg-surface-sunken p-3">
          <div className="text-[11px] text-ink-soft">
            Deposits go to the Circle Gateway Wallet contract and become available to bridge.
          </div>
        </div>
      </div>
    </Card>
  )
}
