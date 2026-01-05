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

const TOKENS = {
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  divider: 'rgba(15,23,42,0.06)',
  border: 'rgba(15,23,42,0.08)',
  primary: '#0B3A8A',
  primaryMuted: 'rgba(11,58,138,0.08)',
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
    } catch {
      // Error toast handled elsewhere
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mt-4 p-5 sm:p-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <div
            className="inline-flex h-7 items-center rounded-full px-[10px] text-[12px] font-medium"
            style={{ background: TOKENS.primaryMuted, color: TOKENS.primary }}
          >
            Employer onboarding
          </div>

          <h2 className="text-[18px] font-semibold" style={{ color: TOKENS.textPrimary }}>
            Finish employer onboarding
          </h2>

          <p className="text-[14px]" style={{ color: TOKENS.textSecondary }}>
            We detected a connected wallet with no employer record yet. Fill this once and the backend
            will map this wallet to your employer profile.
          </p>
        </div>

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
