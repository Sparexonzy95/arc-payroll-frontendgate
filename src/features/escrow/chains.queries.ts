import { useQuery } from '@tanstack/react-query'
import { fetchTokens, type Token } from './chains.lookup'

export function useTokens() {
  return useQuery({
    queryKey: ['chains-tokens'],
    queryFn: fetchTokens,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Convenience hook that returns:
 * - q.data: Token[]
 * - q.map: Record<tokenId, Token>
 */
export function useTokenMap() {
  const q = useTokens()
  const list = q.data ?? []

  const map = list.reduce<Record<number, Token>>((acc, t) => {
    acc[t.id] = t
    return acc
  }, {})

  return { ...q, map }
}
