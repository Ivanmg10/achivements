'use client'

import Link from 'next/link'
import { IconArrowRight, IconChartHistogram, IconLayoutGrid, IconLibrary } from '@tabler/icons-react'
import AuthCollagePanel from '@/components/auth-collage-panel/AuthCollagePanel'
import LandingFeature from '@/components/landing-page/landing-feature/LandingFeature'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import VersionBadge from '@/components/version-badge/VersionBadge'
import { useLanguage } from '@/context/LanguageContext'

const PRIMARY =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-bg-main font-semibold hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main'
const SECONDARY =
  'inline-flex items-center justify-center px-5 py-3 rounded-xl bg-bg-card text-text-main font-medium ring-1 ring-white/10 hover:ring-white/25 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/**
 * What a visitor sees at the door: what CheevoVault is, which platforms it
 * follows, and the two ways in. The art wall from the sign-in page runs
 * quietly behind the opening, so the page shows games rather than describing
 * them.
 */
export default function LandingPage() {
  const { T } = useLanguage()

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col">
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 opacity-20 pointer-events-none select-none">
          <AuthCollagePanel />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-bg-main/70 via-bg-main/85 to-bg-main pointer-events-none"
        />

        <div className="relative max-w-4xl mx-auto px-6 py-24 sm:py-32 flex flex-col items-center text-center gap-6">
          <p className="text-4xl sm:text-5xl font-extrabold tracking-tight">{T.authPage.brand}</p>
          <h1 className="text-2xl sm:text-4xl font-bold max-w-2xl text-balance">{T.landing.tagline}</h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-xl leading-relaxed">{T.landing.intro}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link href="/authPage" className={PRIMARY}>
              {T.landing.createAccount}
              <IconArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/authPage" className={SECONDARY}>
              {T.landing.signIn}
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-sm text-text-secondary">
            <span className="text-xs uppercase tracking-widest text-text-secondary/60">
              {T.landing.platformsLead}
            </span>
            <span className="flex items-center gap-2">
              <RaLogo height={16} />
              RetroAchievements
            </span>
            <span className="flex items-center gap-2">
              <SteamLogo size={16} className="text-[#66c0f4]" aria-hidden="true" />
              Steam
            </span>
            <span className="flex items-center gap-2 text-text-secondary/60">
              <PlaystationLogo size={16} aria-hidden="true" />
              {T.landing.psnSoon}
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-5xl w-full mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        <LandingFeature
          icon={<IconLibrary size={24} />}
          title={T.landing.libraryTitle}
          text={T.landing.libraryText}
        />
        <LandingFeature
          icon={<IconLayoutGrid size={24} />}
          title={T.landing.organiseTitle}
          text={T.landing.organiseText}
        />
        <LandingFeature
          icon={<IconChartHistogram size={24} />}
          title={T.landing.progressTitle}
          text={T.landing.progressText}
        />
      </section>

      <section className="max-w-5xl w-full mx-auto px-6 pb-20">
        <div className="bg-bg-card rounded-3xl ring-1 ring-white/5 px-6 py-10 flex flex-col items-center text-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">{T.landing.closingTitle}</h2>
          <p className="text-sm text-text-secondary max-w-md">{T.landing.closingText}</p>
          <Link href="/authPage" className={PRIMARY}>
            {T.landing.createAccount}
            <IconArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="mt-auto px-6 py-6 text-center text-xs text-text-secondary/60">
        {T.landing.footer}
      </footer>

      <VersionBadge />
    </div>
  )
}
