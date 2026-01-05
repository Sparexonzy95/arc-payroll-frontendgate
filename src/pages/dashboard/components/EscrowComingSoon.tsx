import { Card } from '../../../components/ui/Card'

export function EscrowComingSoon() {
  return (
    <section className="space-y-4 sm:space-y-5">
      <Card className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-700 via-slate-900 to-slate-950 px-4 py-5 sm:px-6 sm:py-6 shadow-lg shadow-[#4189e1]/20">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-slate-100/90">
              <span className="rounded-full bg-slate-950/50 px-2 py-0.5 uppercase tracking-wide">
                Escrow
              </span>
              <span className="rounded-full bg-slate-950/40 px-2 py-0.5">
                Coming soon
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
              Escrow for milestone payouts
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-100/80">
              Lock funds for milestone-based work and release automatically when conditions are met. Transparent status, clean approvals, same dashboard.
            </p>
          </div>

          <span className="mt-2 rounded-full bg-slate-950/70 px-3 py-1 text-[10px] sm:text-xs uppercase tracking-wide text-slate-200">
            In development
          </span>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-16 h-40 w-40 rounded-full bg-[#4189e1]/22 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-slate-200/10 blur-3xl" />
      </Card>
    </section>
  )
}
