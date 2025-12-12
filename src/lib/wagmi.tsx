import type { ReactNode } from 'react'
import { http, createConfig, WagmiProvider } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  ARC_CHAIN_ID,
  BASE_CHAIN_ID,
  ARC_RPC_URL,
  BASE_RPC_URL
} from './config'

// Define Arc testnet as a custom chain for wagmi/viem
export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18
  },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
    public: { http: [ARC_RPC_URL] }
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://explorer.testnet.arc.network'
    }
  }
})

// Base Sepolia (override id from env just to be explicit)
const baseSepoliaChain = {
  ...baseSepolia,
  id: BASE_CHAIN_ID
}

// Global wagmi config: chains, connectors, transports
export const wagmiConfig = createConfig({
  chains: [arcTestnet, baseSepoliaChain],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(ARC_RPC_URL),
    [baseSepoliaChain.id]: http(BASE_RPC_URL)
  }
})

const queryClient = new QueryClient()

// Wrap the whole app with Wagmi + React Query providers
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
