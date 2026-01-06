// src/features/staking/components/StakingComingSoon.tsx
import { Card } from '../../../components/ui/Card'

const NAVY = '#081c36'

export function StakingComingSoon() {
  return (
    <section className="bg-[#F6F8FC]">
      <div className="mx-auto w-full max-w-[1280px] px-3 py-3 sm:px-4 sm:py-4">
        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="relative overflow-hidden rounded-3xl px-4 py-4 sm:px-5 sm:py-5"
            style={{ backgroundColor: NAVY }}
          >
            {/* subtle depth, not loud glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/18" />
            <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-white/8 blur-3xl" />
            <div className="pointer-events-none absolute -left-14 -bottom-14 h-44 w-44 rounded-full bg-white/6 blur-3xl" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/15">
                    Staking
                  </span>
                  <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-semibold text-white/80 ring-1 ring-white/12">
                    Coming soon
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Put idle USDC to work
                </h2>
                <p className="mt-1 max-w-2xl text-[11px] sm:text-xs text-white/75">
                  Delegate part of your treasury into staking strategies and validator rewards while keeping clear visibility from the same dashboard.
                </p>
              </div>

              <span className="hidden sm:inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 ring-1 ring-white/15">
                In development
              </span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
