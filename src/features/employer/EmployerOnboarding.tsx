import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'

interface Props {
  onSubmit: (name: string, email: string) => Promise<void>
  walletAddress?: string
  loading?: boolean
}

const NAVY = '#0E2A55'

const TOKENS = {
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  divider: 'rgba(15,23,42,0.06)',
}

export function EmployerOnboarding({ onSubmit, walletAddress, loading }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || loading) return

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || !trimmedEmail) {
      toast.error('Enter employer name and email')
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(trimmedName, trimmedEmail)
      setName('')
      setEmail('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mt-4 overflow-hidden rounded-3xl">
      {/* NAVY BANNER */}
      <div
        className="relative rounded-b-[32px] px-5 py-6 sm:px-6"
        style={{ backgroundColor: NAVY }}
      >
        {/* decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 max-w-xl">
          <h2 className="text-[20px] font-semibold text-white">
            Get started with Arcflow
          </h2>
          <p className="mt-1 text-[14px] text-white/80">
            Bind your wallet to an employer profile to use payrolls, gateway bridge
            and savings.
          </p>
        </div>
      </div>

      {/* FORM BODY */}
      <div className="p-5 sm:p-6 space-y-4">
        {walletAddress && (
          <div
            className="rounded-[10px] px-3 py-2 text-[12px]"
            style={{
              border: `1px solid ${TOKENS.divider}`,
              background: 'rgba(15,23,42,0.02)',
              color: TOKENS.textSecondary,
            }}
          >
            Wallet:{' '}
            <span className="font-mono" style={{ color: TOKENS.textPrimary }}>
              {walletAddress}
            </span>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${TOKENS.divider}` }} />

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Input
            label="Employer name"
            placeholder="Acme Inc."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            type="email"
            label="Contact email"
            placeholder="ops@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="md:col-span-2 flex justify-end">
            <Button
              type="submit"
              loading={loading || submitting}
              disabled={!name || !email}
            >
              Save employer profile
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
