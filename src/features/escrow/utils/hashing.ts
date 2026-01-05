// src/features/escrow/utils/hashing.ts
import { keccak256, stringToHex, type Hex } from 'viem'

export function shortAddr(a?: string) {
  if (!a) return ''
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

export function termsHashFromText(text: string): Hex {
  const hex = stringToHex(text || '')
  return keccak256(hex)
}

export function prettyErr(e: any) {
  return e?.shortMessage ?? e?.message ?? 'Unknown error'
}
