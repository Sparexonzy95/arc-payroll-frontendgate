import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import {
  useEmployers,
  useCreateEmployer,
  findEmployerByWallet
} from './useEmployers'
import type { Employer } from '../api/employers'
import toast from 'react-hot-toast'

export function useWalletEmployerBinding() {
  const { address, isConnected } = useAccount()
  const {
    data: employers,
    isLoading: employersLoading,
    error: employersError
  } = useEmployers()
  const createEmployerMutation = useCreateEmployer()
  const [activeEmployerId, setActiveEmployerId] = useState<number | null>(null)

  // Find employer whose wallet matches the connected address
  const boundEmployer: Employer | undefined = useMemo(() => {
    if (!employers || !address) return undefined
    return findEmployerByWallet(employers, address)
  }, [employers, address])

  // Auto select bound employer when list loads
  useEffect(() => {
    if (boundEmployer && !activeEmployerId) {
      setActiveEmployerId(boundEmployer.id)
    }
  }, [boundEmployer, activeEmployerId])

  // If the query errored, surface a hint
  useEffect(() => {
    if (employersError) {
      // One toast is enough, so do not spam
      // eslint-disable-next-line no-console
      console.error('Failed to load employers', employersError)
    }
  }, [employersError])

  // Only show onboarding if:
  // - wallet is connected
  // - employers list is loaded
  // - no employer bound to this wallet
  // - and we have not just created one locally
  const needsOnboarding =
    isConnected && !employersLoading && !boundEmployer && !activeEmployerId

  async function onboardEmployer(name: string, email: string) {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    try {
      const created = await createEmployerMutation.mutateAsync({
        name,
        email,
        wallet_address: address
      })

      // Immediately treat this employer as active,
      // even before the employers query refetches.
      setActiveEmployerId(created.id)

      toast.success('Employer profile saved')
    } catch (err) {
      // Log and rethrow so the caller can also handle it
      // eslint-disable-next-line no-console
      console.error('Error creating employer', err)
      toast.error('Failed to save employer profile')
      throw err
    }
  }

  return {
    walletAddress: address,
    isWalletConnected: isConnected,
    employers,
    activeEmployerId,
    setActiveEmployerId,
    boundEmployer,
    needsOnboarding,
    onboardEmployer,
    creatingEmployer: createEmployerMutation.isPending
  }
}
