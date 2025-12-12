// src/features/gateway/GatewayTransferForm.tsx
import { useState } from 'react'
import { useAccount, useSignTypedData } from 'wagmi'
import { pad, zeroAddress, maxUint256 } from 'viem'
import toast from 'react-hot-toast'

import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useGatewayTransfer } from '../../hooks/hooks/useGateway'
import type { Employer } from '../../api/employers'
import { ArrowLeftRight } from 'lucide-react'

interface Props {
  employer: Employer | undefined
}

// Fixed domain IDs for Gateway
const ARC_DOMAIN = 26
const BASE_DOMAIN = 6

// Gateway contract addresses (same across networks on testnet)
const GATEWAY_WALLET_ADDRESS =
  '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as const
const GATEWAY_MINTER_ADDRESS =
  '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as const

// USDC addresses by domain (from Circle docs + your Arc USDC)
const USDC_BY_DOMAIN: Record<number, `0x${string}`> = {
  [BASE_DOMAIN]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  [ARC_DOMAIN]: '0x3600000000000000000000000000000000000000', // Arc Testnet (your USDC)
}

// EIP-712 domain + types for Gateway BurnIntent
const EIP712_DOMAIN = {
  name: 'GatewayWallet',
  version: '1',
} as const

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
] as const

const TransferSpec = [
  { name: 'version', type: 'uint32' },
  { name: 'sourceDomain', type: 'uint32' },
  { name: 'destinationDomain', type: 'uint32' },
  { name: 'sourceContract', type: 'bytes32' },
  { name: 'destinationContract', type: 'bytes32' },
  { name: 'sourceToken', type: 'bytes32' },
  { name: 'destinationToken', type: 'bytes32' },
  { name: 'sourceDepositor', type: 'bytes32' },
  { name: 'destinationRecipient', type: 'bytes32' },
  { name: 'sourceSigner', type: 'bytes32' },
  { name: 'destinationCaller', type: 'bytes32' },
  { name: 'value', type: 'uint256' },
  { name: 'salt', type: 'bytes32' },
  { name: 'hookData', type: 'bytes' },
] as const

const BurnIntent = [
  { name: 'maxBlockHeight', type: 'uint256' },
  { name: 'maxFee', type: 'uint256' },
  { name: 'spec', type: 'TransferSpec' },
] as const

type BurnIntentMessage = {
  maxBlockHeight: bigint
  maxFee: bigint
  spec: {
    version: number
    sourceDomain: number
    destinationDomain: number
    sourceContract: `0x${string}` // bytes32
    destinationContract: `0x${string}` // bytes32
    sourceToken: `0x${string}` // bytes32
    destinationToken: `0x${string}` // bytes32
    sourceDepositor: `0x${string}` // bytes32
    destinationRecipient: `0x${string}` // bytes32
    sourceSigner: `0x${string}` // bytes32
    destinationCaller: `0x${string}` // bytes32
    value: bigint
    salt: `0x${string}`
    hookData: `0x${string}`
  }
}

/**
 * Convert an EVM address to bytes32 (left-padded).
 */
function addressToBytes32(address: `0x${string}`): `0x${string}` {
  return pad(address.toLowerCase() as `0x${string}`, { size: 32 })
}

/**
 * Generate a random 32-byte hex string.
 */
function randomHex32(): `0x${string}` {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `0x${hex}`
}

/**
 * Parse a human string like "0.1" into atomic units with 6 decimals.
 */
function parseAmountToAtomic(amount: string, decimals = 6): bigint {
  const trimmed = amount.trim()
  if (!trimmed) return 0n

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error('Invalid amount format')
  }

  const [whole, frac = ''] = trimmed.split('.')
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  const wholeBig = BigInt(whole)
  const fracBig = BigInt(fracPadded || '0')
  const base = 10n ** BigInt(decimals)

  return wholeBig * base + fracBig
}

/**
 * Build the BurnIntent EIP-712 message.
 */
function buildBurnIntentMessage(params: {
  fromDomain: number
  toDomain: number
  depositor: `0x${string}`
  signer: `0x${string}`
  recipient: `0x${string}`
  amountAtomic: bigint
}): BurnIntentMessage {
  const { fromDomain, toDomain, depositor, signer, recipient, amountAtomic } =
    params

  const fromUsdc = USDC_BY_DOMAIN[fromDomain]
  const toUsdc = USDC_BY_DOMAIN[toDomain]

  if (!fromUsdc || !toUsdc) {
    throw new Error('Unsupported domain for USDC')
  }

  return {
    maxBlockHeight: maxUint256,
    maxFee: 2_010000n, // 2.01 USDC in atomic units
    spec: {
      version: 1,
      sourceDomain: fromDomain,
      destinationDomain: toDomain,
      sourceContract: addressToBytes32(GATEWAY_WALLET_ADDRESS),
      destinationContract: addressToBytes32(GATEWAY_MINTER_ADDRESS),
      sourceToken: addressToBytes32(fromUsdc),
      destinationToken: addressToBytes32(toUsdc),
      sourceDepositor: addressToBytes32(depositor),
      destinationRecipient: addressToBytes32(recipient),
      sourceSigner: addressToBytes32(signer),
      destinationCaller: addressToBytes32(zeroAddress),
      value: amountAtomic,
      salt: randomHex32(),
      hookData: '0x',
    },
  }
}

export function GatewayTransferForm({ employer }: Props) {
  const { address } = useAccount()
  const { signTypedDataAsync, isPending: signing } = useSignTypedData()
  const { mutateAsync, isPending, data } = useGatewayTransfer()

  const [amount, setAmount] = useState('')
  const [activeDirection, setActiveDirection] = useState<
    'arc-base' | 'base-arc' | null
  >(null)

  const disabledBase = !employer || !address || !amount
  const disabledArc = !employer || !address || !amount
  const globalLoading = isPending || signing

  async function handleTransfer(
    fromDomain: number,
    toDomain: number,
    dir: 'arc-base' | 'base-arc'
  ) {
    if (!employer) return
    if (!address) {
      toast.error('Connect your wallet first.')
      return
    }

    try {
      const depositor = address as `0x${string}`
      const signer = address as `0x${string}`
      const recipient = employer.wallet_address as `0x${string}`

      const amountAtomic = parseAmountToAtomic(amount, 6)
      if (amountAtomic <= 0n) {
        toast.error('Amount must be greater than zero.')
        return
      }

      setActiveDirection(dir)

      // Build EIP-712 burnIntent message
      const burnIntentMessage = buildBurnIntentMessage({
        fromDomain,
        toDomain,
        depositor,
        signer,
        recipient,
        amountAtomic,
      })

      // Sign with connected wallet
      const signature = await signTypedDataAsync({
        domain: EIP712_DOMAIN,
        types: {
          EIP712Domain,
          TransferSpec,
          BurnIntent,
        } as any,
        primaryType: 'BurnIntent',
        message: burnIntentMessage,
      })

      const burnRequests = [
        {
          burnIntent: burnIntentMessage,
          signature,
        },
      ]

      const result = await mutateAsync({
        employer_id: employer.id,
        token: 'USDC',
        burn_requests: burnRequests,
      })

      toast.success(`Gateway transfer status: ${result.status}`)
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.message ||
        err?.response?.data?.detail ||
        'Gateway transfer failed. See console or backend logs.'
      toast.error(msg)
    } finally {
      setActiveDirection(null)
    }
  }

  return (
    <Card className="relative rounded-2xl border border-subtle bg-surface-elevated p-0 shadow-soft">
      {/* glow accents */}
      <div className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full bg-[#1a5bab]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-4 right-0 h-20 w-20 rounded-full bg-[#4189e1]/30 blur-2xl" />

      {/* full-width inner wrapper */}
      <div className="flex w-full flex-col gap-6 p-6">
        {/* header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4189e1]/20 ring-1 ring-[#4189e1]/45">
            <ArrowLeftRight className="h-6 w-6 text-[#e3eefa]" />
          </div>
          <div>
            <h2 className="text-sm font-heading font-semibold uppercase tracking-wide text-ink-primary">
              Bridge USDC between Arc & Base
            </h2>
            <p className="text-xs text-ink-soft">
              Signs a Circle Gateway burn intent and forwards it to your backend
              to request an attestation.
            </p>
          </div>
        </div>

        {/* amount input */}
        <Input
          label="Amount (USDC)"
          placeholder="0.10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!employer || !address}
          helperText="Human readable amount, converted to 6-decimal atomic units inside the burn intent."
          className="text-sm"
        />

        {/* dual-direction buttons */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Button
            type="button"
            variant="primary"
            disabled={disabledBase || globalLoading}
            loading={activeDirection === 'arc-base' && globalLoading}
            onClick={() =>
              handleTransfer(ARC_DOMAIN, BASE_DOMAIN, 'arc-base')
            }
            className="flex w-full items-center justify-center gap-2"
          >
            Arc → Base
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={disabledArc || globalLoading}
            loading={activeDirection === 'base-arc' && globalLoading}
            onClick={() =>
              handleTransfer(BASE_DOMAIN, ARC_DOMAIN, 'base-arc')
            }
            className="flex w-full items-center justify-center gap-2"
          >
            Base → Arc
          </Button>
        </div>

        {/* status / info */}
        {data && (
          <div className="rounded-xl border border-subtle bg-surface-sunken p-3 text-xs text-ink-primary">
            <div>Status: {data.status}</div>
            {data.created_at && <div>Created: {data.created_at}</div>}
          </div>
        )}

        {!employer && (
          <p className="text-xs text-ink-soft">
            Onboard as an employer to enable Gateway transfers.
          </p>
        )}
        {employer && !address && (
          <p className="text-xs text-ink-soft">
            Connect your wallet to sign the Gateway burn intent.
          </p>
        )}
      </div>
    </Card>
  )
}
