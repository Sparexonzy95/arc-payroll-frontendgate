// src/components/Footer.tsx
import { Link } from 'react-router-dom'
import {
  IconBrandX,
  IconBrandGithub,
  IconBrandDiscord,
  IconBrandTelegram,
  IconBrandLinkedin,
} from '@tabler/icons-react'
import arcflowLogo from '../assets/arcflow-logo.png'

const TOKENS = {
  bg: '#F3F5F9',
  border: 'rgba(15,23,42,0.08)',
  textMuted: '#94A3B8',
  link: '#64748B',
  linkHover: '#0B3A8A',
  socialBg: 'rgba(15,23,42,0.06)',
  socialBorder: 'rgba(15,23,42,0.10)',
  socialHover: 'rgba(11,58,138,0.12)',
  pillBg: '#0E2A55',
}

const SOCIAL_ICON = { size: 18, stroke: 1.6 }

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-[12px] uppercase tracking-[0.18em] transition-colors"
      style={{ color: TOKENS.link }}
    >
      {children}
    </Link>
  )
}

function SocialIcon({
  label,
  href,
  children,
}: {
  label: string
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-[background,transform] duration-150 ease-out hover:-translate-y-[1px]"
      style={{
        background: TOKENS.socialBg,
        borderColor: TOKENS.socialBorder,
        color: TOKENS.link,
      }}
    >
      {children}
    </a>
  )
}

export function Footer() {
  return (
    <footer style={{ background: TOKENS.bg, borderTop: `1px solid ${TOKENS.border}` }}>
      {/* ✅ only changed padding to be responsive, desktop stays the same */}
      <div className="w-full px-4 sm:px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="text-[12px]" style={{ color: TOKENS.textMuted }}>
              © {new Date().getFullYear()} Arcflow. All rights reserved.
            </div>

            <div
              className="hidden md:flex items-center gap-2 rounded-full px-3 py-1"
              style={{
                background: TOKENS.pillBg,
                color: 'white',
                boxShadow: '0 10px 22px rgba(2,6,23,0.12)',
              }}
            >
              <span className="text-[12px]" style={{ opacity: 0.8 }}>
                Powered by
              </span>
              <img
                src={arcflowLogo}
                alt="Arcflow"
                className="h-4 w-auto"
                style={{ display: 'block', objectFit: 'contain' }}
                draggable={false}
              />
            </div>
          </div>

          {/* Middle */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-start md:justify-center">
            <FooterLink to="/dashboard">Product</FooterLink>
            <FooterLink to="/about">Company</FooterLink>
            <FooterLink to="/docs">Developers</FooterLink>
            <FooterLink to="/terms">Terms</FooterLink>
          </div>

          {/* Right */}
          <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
            <SocialIcon label="X" href="#">
              <IconBrandX {...SOCIAL_ICON} />
            </SocialIcon>
            <SocialIcon label="GitHub" href="#">
              <IconBrandGithub {...SOCIAL_ICON} />
            </SocialIcon>
            <SocialIcon label="Discord" href="#">
              <IconBrandDiscord {...SOCIAL_ICON} />
            </SocialIcon>
            <SocialIcon label="Telegram" href="#">
              <IconBrandTelegram {...SOCIAL_ICON} />
            </SocialIcon>
            <SocialIcon label="LinkedIn" href="#">
              <IconBrandLinkedin {...SOCIAL_ICON} />
            </SocialIcon>
          </div>

          {/* Mobile powered pill */}
          <div className="md:hidden">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-2"
              style={{
                background: TOKENS.pillBg,
                color: 'white',
                boxShadow: '0 10px 22px rgba(2,6,23,0.12)',
                minHeight: 40, // ✅ prevents logo cutting on small screens
                lineHeight: 1,
              }}
            >
              <span className="text-[12px]" style={{ opacity: 0.8 }}>
                Powered by
              </span>
              <img
                src={arcflowLogo}
                alt="Arcflow"
                className="h-5 w-auto"
                style={{ display: 'block', objectFit: 'contain' }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        footer a:hover { color: ${TOKENS.linkHover} !important; }
        footer a[aria-label]:hover { background: ${TOKENS.socialHover} !important; }
      `}</style>
    </footer>
  )
}
