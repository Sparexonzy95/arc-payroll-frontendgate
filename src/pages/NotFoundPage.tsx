import { Card } from '../components/ui/Card'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-x-0 -top-40 h-72 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_60%)]" />

      <Card className="relative max-w-md w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-6 py-8 shadow-xl shadow-black/40">
        {/* subtle glow blobs */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 right-0 h-24 w-24 rounded-full bg-emerald-500/15 blur-2xl" />

        <div className="relative space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
            404 · Not found
          </p>

          <h1 className="text-2xl font-semibold text-slate-50">
            Page not found
          </h1>

          <p className="text-sm leading-relaxed text-slate-400">
            The page you requested does not exist. You can jump back into the
            main dashboard or view your payroll streams.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                Go to dashboard
              </Button>
            </Link>

            <Link to="/payrolls">
              <Button variant="secondary" size="sm">
                View payrolls
              </Button>
            </Link>

            <Link to="/">
              <Button variant="ghost" size="sm">
                Back to landing
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
