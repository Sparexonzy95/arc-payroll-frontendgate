import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface Props {
  onSubmit: (name: string, email: string) => Promise<void>
  walletAddress?: string
  loading?: boolean
}

export function EmployerOnboarding({
  onSubmit,
  walletAddress,
  loading,
}: Props) {
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
      // Clear the form on success
      setName('')
      setEmail('')
    } catch {
      // Error toast is handled in the hook already
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mt-4 border-dashed border-[color:var(--brand-400)] bg-surface-elevated">
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <h2 className="text-[18px] font-heading font-semibold text-ink-primary">
            Finish employer onboarding
          </h2>
          <p className="text-[13px] text-ink-muted">
            We detected a connected wallet with no employer record yet. Fill this
            once and the backend will map this wallet to your employer profile.
          </p>
        </div>

        {walletAddress && (
          <div className="rounded-xl border border-subtle bg-surface-sunken px-3 py-2 text-[12px] text-ink-soft">
            Wallet:{' '}
            <span className="font-mono text-ink-primary">
              {walletAddress}
            </span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2"
        >
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
      </motion.div>
    </Card>
  )
}
