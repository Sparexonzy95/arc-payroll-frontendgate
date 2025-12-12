// src/lib/gatewayConfig.ts

/**
 * Static config for Circle Gateway domains and contracts.
 *
 * NOTE:
 * - GatewayWallet and GatewayMinter addresses are the same across domains (per Circle docs).
 * - USDC addresses are chain-specific.
 * - Adjust ARC_USDC_ADDRESS if Circle publishes a different one for Arc Testnet.
 */

export const GATEWAY_WALLET_ADDRESS =
  '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as const

export const GATEWAY_MINTER_ADDRESS =
  '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as const

export type GatewayDomainConfig = {
  domain: number
  label: string
  usdcAddress: `0x${string}`
  gatewayWalletAddress: `0x${string}`
  gatewayMinterAddress: `0x${string}`
}

/**
 * USDC addresses from Circle testnet docs.
 * - sepolia       -> domain 0
 * - baseSepolia   -> domain 6
 * - avalancheFuji -> domain 1 (not used here but listed in docs)
 *
 * For Arc Testnet we reuse the USDC address you already use in CCTP:
 *   0x3600000000000000000000000000000000000000
 */
const BASE_SEPOLIA_USDC =
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const

const ARC_TESTNET_USDC =
  '0x3600000000000000000000000000000000000000' as const

export const GATEWAY_DOMAIN_CONFIG: Record<number, GatewayDomainConfig> = {
  6: {
    domain: 6,
    label: 'Base (domain 6)',
    usdcAddress: BASE_SEPOLIA_USDC,
    gatewayWalletAddress: GATEWAY_WALLET_ADDRESS,
    gatewayMinterAddress: GATEWAY_MINTER_ADDRESS
  },
  26: {
    domain: 26,
    label: 'Arc Testnet (domain 26)',
    usdcAddress: ARC_TESTNET_USDC,
    gatewayWalletAddress: GATEWAY_WALLET_ADDRESS,
    gatewayMinterAddress: GATEWAY_MINTER_ADDRESS
  }
}
