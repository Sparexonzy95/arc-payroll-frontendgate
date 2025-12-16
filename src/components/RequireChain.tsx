import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import toast from 'react-hot-toast'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

type Props = {
  requiredChainId: number
  chainName: string
  children: ReactNode

  /**
   * If true: when user is on wrong chain, we show a blocker UI and don't render children.
   * If false: we only show a warning banner and still render children.
   */
  strict?: boolean

  /**
   * If true: attempt auto-switch once when connected and wrong chain.
   * (Mobile wallets sometimes ignore it, but it helps where supported.)
   */
  autoSwitchOnce?: boolean
}

export function RequireChain({
  requiredChainId,
  chainName,
  children,
  strict = true,
  autoSwitchOnce = true,
}: Props) {
  const { isConnected, chainId } = useAccount()
  const { switchChainAsync, isPending } = useSwitchChain()

  const wrong = useMemo(
    () => isConnected && chainId !== undefined && chainId !== requiredChainId,
    [isConnected, chainId, requiredChainId]
  )

  const [attemptedAuto, setAttemptedAuto] = useState(false)

  useEffect(() => {
    if (!autoSwitchOnce) return
    if (!isConnected) return
    if (!wrong) return
    if (attemptedAuto) return

    setAttemptedAuto(true)

    ;(async () => {
      try {
        await switchChainAsync({ chainId: requiredChainId })
        toast.success(`Switched to ${chainName}`)
      } catch {
        // silent: user will click button manually
      }
    })()
  }, [
    autoSwitchOnce,
    isConnected,
    wrong,
    attemptedAuto,
    requiredChainId,
    chainName,
    switchChainAsync,
  ])

  if (!isConnected) {
    // Let your existing connect gate handle this
    return <>{children}</>
  }

  if (!wrong) return <>{children}</>

  if (!strict) {
    return (
      <div className="space-y-3">
        <Card className="border border-amber-500/30 bg-slate-950/70 p-4">
          <p className="text-sm text-amber-200">
            Wrong network. Switch to <span className="font-semibold">{chainName}</span> for best results.
          </p>
          <div className="mt-3">
            <Button
              size="sm"
              disabled={isPending}
              onClick={async () => {
                try {
                  await switchChainAsync({ chainId: requiredChainId })
                  toast.success(`Switched to ${chainName}`)
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to switch network')
                }
              }}
            >
              {isPending ? 'Switching…' : `Switch to ${chainName}`}
            </Button>
          </div>
        </Card>

        {children}
      </div>
    )
  }

  return (
    <Card className="border border-slate-800/80 bg-slate-950/80 p-5">
      <p className="text-sm text-slate-200">
        Wrong network. Switch to <span className="font-semibold">{chainName}</span> to continue.
      </p>

      <div className="mt-4">
        <Button
          size="sm"
          disabled={isPending}
          onClick={async () => {
            try {
              await switchChainAsync({ chainId: requiredChainId })
              toast.success(`Switched to ${chainName}`)
            } catch (e: any) {
              toast.error(e?.message || 'Failed to switch network')
            }
          }}
        >
          {isPending ? 'Switching…' : `Switch to ${chainName}`}
        </Button>
      </div>
    </Card>
  )
}
