import { useQuery } from '@tanstack/react-query'
import { fetchChains, fetchTokens, type ChainDTO, type TokenDTO } from '../../api/chains'

export function useChains() {
  return useQuery<ChainDTO[]>({
    queryKey: ['chains'],
    queryFn: fetchChains
  })
}

export function useTokens() {
  return useQuery<TokenDTO[]>({
    queryKey: ['tokens'],
    queryFn: fetchTokens
  })
}

export function filterTokensByChain(
  tokens: TokenDTO[] | undefined,
  chainId: number | undefined
) {
  if (!tokens || !chainId) return []
  return tokens.filter((t) => t.chain === chainId && t.is_supported)
}
