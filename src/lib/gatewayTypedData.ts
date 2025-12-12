// src/lib/gatewayTypedData.ts

/**
 * EIP-712 typed data helpers for Circle Gateway burn intents.
 *
 * This mirrors the "typed-data.js" from Circle's quickstarts, but adapted
 * to run in the browser with viem + wagmi.
 */

import { pad, zeroAddress, maxUint256 } from 'viem'

export const GATEWAY_EIP712_DOMAIN = {
  name: 'GatewayWallet',
  version: '1'
} as const

// EIP-712 type definitions
export const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' }
] as const

export const TransferSpec = [
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
  { name: 'hookData', type: 'bytes' }
] as const

export const BurnIntent = [
  { name: 'maxBlockHeight', type: 'uint256' },
  { name: 'maxFee', type: 'uint256' },
  { name: 'spec', type: 'TransferSpec' }
] as const

export type BurnIntentSpec = {
  version: number
  sourceDomain: number
  destinationDomain: number
  sourceContract: `0x${string}` // 20-byte address before padding
  destinationContract: `0x${string}`
  sourceToken: `0x${string}`
  destinationToken: `0x${string}`
  sourceDepositor: `0x${string}`
  destinationRecipient: `0x${string}`
  sourceSigner: `0x${string}`
  destinationCaller: `0x${string}`
  value: bigint
  salt: `0x${string}` // 32-byte hex
  hookData: `0x${string}`
}

export type BurnIntentStruct = {
  maxBlockHeight: bigint
  maxFee: bigint
  spec: BurnIntentSpec
}

export type BurnIntentTypedData = {
  domain: typeof GATEWAY_EIP712_DOMAIN
  types: {
    EIP712Domain: typeof EIP712Domain
    TransferSpec: typeof TransferSpec
    BurnIntent: typeof BurnIntent
  }
  primaryType: 'BurnIntent'
  message: {
    maxBlockHeight: bigint
    maxFee: bigint
    spec: {
      version: number
      sourceDomain: number
      destinationDomain: number
      sourceContract: `0x${string}`
      destinationContract: `0x${string}`
      sourceToken: `0x${string}`
      destinationToken: `0x${string}`
      sourceDepositor: `0x${string}`
      destinationRecipient: `0x${string}`
      sourceSigner: `0x${string}`
      destinationCaller: `0x${string}`
      value: bigint
      salt: `0x${string}`
      hookData: `0x${string}`
    }
  }
}

function randomHex32(): `0x${string}` {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `0x${hex}`
}

function addressToBytes32(address: `0x${string}`): `0x${string}` {
  return pad(address.toLowerCase() as `0x${string}`, { size: 32 })
}

/**
 * Build a BurnIntent struct from higher-level params.
 *
 * amountAtomic is in USDC atomic units (6 decimals).
 */
export function buildBurnIntent(params: {
  accountAddress: `0x${string}`
  fromDomain: number
  toDomain: number
  gatewayWalletAddress: `0x${string}`
  gatewayMinterAddress: `0x${string}`
  sourceTokenAddress: `0x${string}`
  destinationTokenAddress: `0x${string}`
  amountAtomic: bigint
  recipientAddress?: `0x${string}`
}): BurnIntentStruct {
  const {
    accountAddress,
    fromDomain,
    toDomain,
    gatewayWalletAddress,
    gatewayMinterAddress,
    sourceTokenAddress,
    destinationTokenAddress,
    amountAtomic,
    recipientAddress
  } = params

  const recipient = recipientAddress ?? accountAddress

  return {
    // These follow Circle quickstart defaults
    maxBlockHeight: maxUint256, // effectively "no expiry"
    maxFee: 2_010000n, // 2.01 USDC in atomic units
    spec: {
      version: 1,
      sourceDomain: fromDomain,
      destinationDomain: toDomain,
      sourceContract: gatewayWalletAddress,
      destinationContract: gatewayMinterAddress,
      sourceToken: sourceTokenAddress,
      destinationToken: destinationTokenAddress,
      sourceDepositor: accountAddress,
      destinationRecipient: recipient,
      sourceSigner: accountAddress,
      destinationCaller: zeroAddress,
      value: amountAtomic,
      salt: randomHex32(),
      hookData: '0x'
    }
  }
}

/**
 * Turn a BurnIntentStruct into EIP-712 typed data,
 * converting all address fields in spec to bytes32.
 *
 * This `typedData` is used both for:
 *  - wagmi `signTypedData`
 *  - the `burnIntent` body sent to Circle (after BigInt->string conversion)
 */
export function buildBurnIntentTypedData(
  intent: BurnIntentStruct
): BurnIntentTypedData {
  const { maxBlockHeight, maxFee, spec } = intent

  const message: BurnIntentTypedData['message'] = {
    maxBlockHeight,
    maxFee,
    spec: {
      ...spec,
      sourceContract: addressToBytes32(spec.sourceContract),
      destinationContract: addressToBytes32(spec.destinationContract),
      sourceToken: addressToBytes32(spec.sourceToken),
      destinationToken: addressToBytes32(spec.destinationToken),
      sourceDepositor: addressToBytes32(spec.sourceDepositor),
      destinationRecipient: addressToBytes32(spec.destinationRecipient),
      sourceSigner: addressToBytes32(spec.sourceSigner),
      destinationCaller: addressToBytes32(spec.destinationCaller ?? zeroAddress)
    }
  }

  return {
    domain: GATEWAY_EIP712_DOMAIN,
    types: {
      EIP712Domain,
      TransferSpec,
      BurnIntent
    },
    primaryType: 'BurnIntent',
    message
  }
}
