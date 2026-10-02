'use client'

import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'
import LandingNav from '@/components/landing-page/landing-nav/LandingNav'
import LandingHero from '@/components/landing-page/landing-hero/LandingHero'
import LandingBento from '@/components/landing-page/landing-bento/LandingBento'
import VersionBadge from '@/components/version-badge/VersionBadge'
import LegalLinks from '@/components/legal-links/LegalLinks'
import { useLanguage } from '@/context/LanguageContext'

const PRIMARY =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-bg-main font-semibold hover:bg-accent-hover active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main'

/**
 * What a visitor sees at the door: what CheevoVault is beside the games it
 * follows, what you get, and the way in. Signing in lives in the bar; the
 * page itself asks for one thing, creating an account.
 */
export default function LandingPage() {
  const { T } = useLanguage()

  return (
    <div className="min-h-[100dvh] bg-bg-main text-text-main flex flex-col">
      <LandingNav />
      <LandingHero />
      <LandingBento />

      <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden bg-bg-card rounded-3xl ring-1 ring-white/[0.06] px-6 py-12 flex flex-col items-center text-center gap-4">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.12),transparent_60%)]" />
          <h2 className="relative text-2xl sm:text-3xl font-bold tracking-tight">{T.landing.closingTitle}</h2>
          <p className="relative text-sm sm:text-base text-text-secondary max-w-md">{T.landing.closingText}</p>
          <Link href="/authPage?mode=register" className={`relative ${PRIMARY}`}>
            {T.landing.createAccount}
            <IconArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="mt-auto px-6 py-6 flex flex-col items-center gap-2 text-center text-xs text-text-secondary/60">
        <span>{T.landing.footer}</span>
        <LegalLinks />
      </footer>

      <VersionBadge />
    </div>
  )
}
