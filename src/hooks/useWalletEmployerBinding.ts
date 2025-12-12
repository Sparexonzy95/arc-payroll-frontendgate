// src/hooks/useWalletEmployerBinding.ts
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import {
  useEmployers,
  useCreateEmployer,
  findEmployerByWallet,
} from './useEmployers'
import type { Employer } from '../api/employers'
import toast from 'react-hot-toast'

export function useWalletEmployerBinding() {
  const { address, isConnected } = useAccount()

  // ⛔️ do NOT fetch employers until wallet is connected
  const {
    data: employers,
    isLoading: employersLoading,
    error: employersError,
    refetch: refetchEmployers,
  } = useEmployers(isConnected)

  const createEmployerMutation = useCreateEmployer()
  const [activeEmployerId, setActiveEmployerId] = useState<number | null>(null)

  /**
   * Reset state when wallet changes
   */
  const lastAddressRef = useRef<string | undefined>()
  useEffect(() => {
    if (
      lastAddressRef.current &&
      address &&
      lastAddressRef.current.toLowerCase() !== address.toLowerCase()
    ) {
      setActiveEmployerId(null)
    }
    lastAddressRef.current = address
  }, [address])

  /**
   * Find employer bound to wallet
   */
  const boundEmployer: Employer | undefined = useMemo(() => {
    if (!employers || !address) return undefined
    return findEmployerByWallet(employers, address)
  }, [employers, address])

  /**
   * Auto-select employer once known
   */
  useEffect(() => {
    if (boundEmployer && !activeEmployerId) {
      setActiveEmployerId(boundEmployer.id)
    }
  }, [boundEmployer, activeEmployerId])

  /**
   * Log backend errors once
   */
  useEffect(() => {
    if (employersError) {
      console.error('Failed to load employers', employersError)
    }
  }, [employersError])

  /**
   * ✅ KEY FIX:
   * Do NOT block onboarding on employersLoading.
   * Show onboarding immediately after wallet connect.
   */
  const needsOnboarding =
    isConnected && !boundEmployer && !activeEmployerId

  const checkingEmployers = Boolean(isConnected && employersLoading)

  async function onboardEmployer(name: string, email: string) {
    if (!address) throw new Error('Wallet not connected')

    try {
      const created = await createEmployerMutation.mutateAsync({
        name,
        email,
        wallet_address: address,
      })

      // Immediately activate
      setActiveEmployerId(created.id)

      // Background sync (non-blocking)
      refetchEmployers?.().catch(() => {})

      toast.success('Employer profile saved')
      return created
    } catch (err) {
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

    // optional UX helper
    checkingEmployers,

    needsOnboarding,
    onboardEmployer,
    creatingEmployer: createEmployerMutation.isPending,
  }
}
