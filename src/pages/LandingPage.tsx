// src/pages/LandingPage.tsx
import { Link } from 'react-router-dom'
import {
  Github,
  Twitter,
  MessageCircle,
  Briefcase,
  ArrowLeftRight,
  PiggyBank,
  Coins,
  ShieldCheck,
} from 'lucide-react'

import { ArcflowLogo } from '../components/branding/ArcflowLogo'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export function LandingPage() {
  const year = new Date().getFullYear()

  return (
    <div className="relative flex min-h-screen flex-col bg-surface-body text-ink-primary">
      {/* GLOBAL BACKDROP GLOW */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(65,137,225,0.2),transparent_55%)]" />

      {/* NAVBAR */}
      <header className="relative z-20 border-b border-subtle bg-[var(--nav-bg)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:py-4 lg:px-8">
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <ArcflowLogo compact className="h-8 xs:h-9 md:h-11" />
          </div>

          {/* ACTIONS */}
          <Link to="/dashboard" className="shrink-0">
            <Button
              variant="primary"
              size="sm"
              className="rounded-full px-4 py-2 text-[11px] xs:px-5 xs:text-[12px] md:px-6 md:py-2.5 md:text-[13px]"
            >
              Launch app
            </Button>
          </Link>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="relative z-10 flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          {/* HERO */}
          <section className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="max-w-3xl space-y-6 sm:space-y-7 md:space-y-8">
              <h1 className="font-heading text-[1.9rem] font-semibold leading-tight tracking-tight text-ink-primary xs:text-[2.1rem] sm:text-[2.4rem] md:text-[2.9rem] lg:text-[3.2rem]">
                <span className="text-[color:var(--brand-200)]">
                  Seamless
                </span>{' '}
                <span>On-Chain Finance</span>
                <br className="hidden sm:block" />
                <span className="hidden sm:inline">Tools to </span>
                <span className="inline sm:hidden">
                  Tools to&nbsp;
                </span>
                <span className="text-[color:var(--brand-200)]">
                  Earn, Grow,&nbsp;&amp; Save
                </span>
              </h1>

              {/* POWERED BY ARC line */}
              <div className="flex items-center justify-center gap-3 text-[10px] xs:text-[11px] tracking-[0.22em] uppercase text-ink-soft">
                <span className="hidden h-px w-8 bg-[rgba(148,163,184,0.5)] sm:block" />
                <span>Powered by Arc</span>
                <span className="hidden h-px w-8 bg-[rgba(148,163,184,0.5)] sm:block" />
              </div>

              <p className="mx-auto max-w-2xl text-[13px] leading-relaxed text-ink-soft sm:text-sm md:text-[15px]">
                Automate USDC and EURC payrolls, bridge treasury between Arc and
                Base, and grow buffers in flexible savings vaults from a single
                on-chain operating screen.
              </p>

              {/* ACTION BUTTONS */}
              <div className="mt-2 flex w-full flex-col items-center gap-3 xs:flex-row xs:justify-center xs:gap-4">
                <Link
                  to="/dashboard"
                  className="w-full xs:w-auto xs:flex-1 sm:flex-none"
                >
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full rounded-full px-6 py-2.5 text-[13px]"
                  >
                    Launch app
                  </Button>
                </Link>

                <a
                  href="#arcflow-tools"
                  className="w-full xs:w-auto xs:flex-1 sm:flex-none"
                >
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full rounded-full px-6 py-2.5 text-[13px]"
                  >
                    Explore core tools
                  </Button>
                </a>
              </div>
            </div>
          </section>

          {/* CORE TOOLS GRID */}
          <section
            id="arcflow-tools"
            className="mt-12 w-full max-w-5xl self-center sm:mt-14 md:mt-16"
          >
            <Card className="border-subtle bg-surface-elevated px-4 py-7 sm:px-6 sm:py-8 md:px-8 md:py-10">
              <div className="mb-7 text-center sm:mb-8">
                <h2 className="font-heading text-xl font-semibold tracking-tight text-ink-primary sm:text-2xl md:text-3xl">
                  Core tools
                </h2>
                <p className="mt-2 text-[13px] text-ink-soft sm:text-sm md:text-base">
                  The rails powering your stablecoin operations on Arc.
                </p>
              </div>

              <div className="grid gap-6 text-[13px] sm:gap-7 sm:text-sm md:grid-cols-2 lg:grid-cols-3">
                {/* Payrolls */}
                <div className="noise-surface rounded-2xl border border-subtle bg-surface-sunken p-5 sm:p-6 transition-colors hover:bg-[rgba(5,13,25,0.96)]">
                  <div className="mb-3 flex items-center gap-3 sm:mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--brand-500)]/14 ring-1 ring-[color:var(--brand-400)]/55 sm:h-11 sm:w-11">
                      <Briefcase className="h-4 w-4 text-[color:var(--brand-50)] sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink-primary">
                      Payrolls
                    </h3>
                  </div>
                  <p className="text-[12px] leading-relaxed text-ink-soft sm:text-[13px]">
                    Draft once, fund in USDC or EURC, then dispatch across Arc
                    with instant or scheduled payout cycles.
                  </p>
                </div>

                {/* Gateway bridge */}
                <div className="noise-surface rounded-2xl border border-subtle bg-surface-sunken p-5 sm:p-6 transition-colors hover:bg-[rgba(5,13,25,0.96)]">
                  <div className="mb-3 flex items-center gap-3 sm:mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--brand-500)]/14 ring-1 ring-[color:var(--brand-400)]/55 sm:h-11 sm:w-11">
                      <ArrowLeftRight className="h-4 w-4 text-[color:var(--brand-50)] sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink-primary">
                      Gateway bridge
                    </h3>
                  </div>
                  <p className="text-[12px] leading-relaxed text-ink-soft sm:text-[13px]">
                    Bridge USDC between Arc and Base with Circle CCTP and keep
                    your treasury view unified inside Arcflow.
                  </p>
                </div>

                {/* Savings */}
                <div className="noise-surface rounded-2xl border border-subtle bg-surface-sunken p-5 sm:p-6 transition-colors hover:bg-[rgba(5,13,25,0.96)]">
                  <div className="mb-3 flex items-center gap-3 sm:mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--brand-500)]/14 ring-1 ring-[color:var(--brand-400)]/55 sm:h-11 sm:w-11">
                      <PiggyBank className="h-4 w-4 text-[color:var(--brand-50)] sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink-primary">
                      Piggyvest savings
                    </h3>
                  </div>
                  <p className="text-[12px] leading-relaxed text-ink-soft sm:text-[13px]">
                    Flexible and fixed vaults for runway and buffers, still
                    close enough to feed upcoming payrolls in a click.
                  </p>
                </div>

                {/* Staking (soon) – stretched on md+ */}
                <div className="noise-surface rounded-2xl border border-subtle bg-surface-sunken p-5 sm:p-6 transition-colors hover:bg-[rgba(5,13,25,0.96)] md:col-span-2 lg:col-span-3">
                  <div className="mb-3 flex items-center gap-3 sm:mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--brand-500)]/14 ring-1 ring-[color:var(--brand-400)]/55 sm:h-11 sm:w-11">
                      <Coins className="h-4 w-4 text-[color:var(--brand-50)] sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink-primary">
                      Staking
                      <span className="ml-2 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] uppercase text-ink-soft">
                        Soon
                      </span>
                    </h3>
                  </div>
                  <p className="text-[12px] leading-relaxed text-ink-soft sm:text-[13px] sm:max-w-xl md:max-w-2xl">
                    Put a slice of idle treasury to work in curated strategies,
                    with clear separation from payroll funds and full treasury
                    visibility.
                  </p>
                </div>

                {/* Escrow (soon) – stretched on md+ */}
                <div className="noise-surface rounded-2xl border border-subtle bg-surface-sunken p-5 sm:p-6 transition-colors hover:bg-[rgba(5,13,25,0.96)] md:col-span-2 lg:col-span-3">
                  <div className="mb-3 flex items-center gap-3 sm:mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--brand-500)]/14 ring-1 ring-[color:var(--brand-400)]/55 sm:h-11 sm:w-11">
                      <ShieldCheck className="h-4 w-4 text-[color:var(--brand-50)] sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink-primary">
                      Escrow
                      <span className="ml-2 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] uppercase text-ink-soft">
                        Soon
                      </span>
                    </h3>
                  </div>
                  <p className="text-[12px] leading-relaxed text-ink-soft sm:text-[13px] sm:max-w-xl md:max-w-2xl">
                    Milestone-based payouts for grants, vendors and bounties, so
                    you only release funds as work ships while keeping payroll
                    rails untouched.
                  </p>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 border-t border-subtle bg-surface-elevated">
        <div className="mx-auto w-full max-w-6xl px-4 py-9 sm:px-6 sm:py-10 md:px-8 md:py-14">
          {/* TOP */}
          <div className="grid gap-8 md:grid-cols-[2fr_3fr] md:gap-10">
            {/* BRAND */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ArcflowLogo compact className="h-6 md:h-7" />
              </div>

              <p className="max-w-sm text-[12px] leading-relaxed text-ink-soft sm:text-[13px]">
                Arc-native payroll automation, treasury bridging, and USDC / EURC
                savings built for teams running stablecoin operations on modern
                L2 rails.
              </p>
            </div>

            {/* COLUMNS */}
            <div className="grid gap-6 text-[12px] sm:grid-cols-2 sm:text-[13px] md:grid-cols-3 md:gap-8">
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-primary sm:text-[12px]">
                  Product
                </h4>
                <ul className="mt-3 space-y-2 text-ink-soft">
                  <li>Payroll automation</li>
                  <li>Bridge and treasury</li>
                  <li>Savings vaults</li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-primary sm:text-[12px]">
                  Assets
                </h4>
                <ul className="mt-3 space-y-2 text-ink-soft">
                  <li>USDC on Arc</li>
                  <li>EURC on Arc</li>
                  <li>Unified balances</li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-primary sm:text-[12px]">
                  Network
                </h4>
                <ul className="mt-3 space-y-2 text-ink-soft">
                  <li>Arc Testnet</li>
                  <li>Base Sepolia</li>
                  <li>More chains soon</li>
                </ul>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-subtle pt-4 text-[11px] text-ink-soft sm:mt-10 sm:flex-row sm:pt-5">
            <span className="text-center sm:text-left">
              © {year} Arcflow · Arc-native payroll and treasury
            </span>

            <div className="flex items-center gap-4 sm:gap-5">
              <a
                href="#"
                className="flex items-center gap-1.5 transition-colors hover:text-ink-primary"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-1.5 transition-colors hover:text-ink-primary"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Discord</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-1.5 transition-colors hover:text-ink-primary"
              >
                <Twitter className="h-4 w-4" />
                <span className="hidden sm:inline">Twitter</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
