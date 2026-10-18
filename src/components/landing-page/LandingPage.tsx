'use client'

import LandingNav from '@/components/landing-page/landing-nav/LandingNav'
import LandingHero from '@/components/landing-page/landing-hero/LandingHero'
import LandingBento from '@/components/landing-page/landing-bento/LandingBento'
import LandingClosing from '@/components/landing-page/landing-closing/LandingClosing'
import FaqList from '@/components/faq-list/FaqList'
import PublicFooter from '@/components/public-footer/PublicFooter'
import VersionBadge from '@/components/version-badge/VersionBadge'
import { useLanguage } from '@/context/LanguageContext'

/**
 * What a visitor sees at the door: what CheevoVault is beside the games it
 * follows, what you get, the questions people ask first, and the way in.
 * Signing in lives in the bar; the page itself asks for one thing, creating
 * an account.
 */
export default function LandingPage() {
  const { T } = useLanguage()

  return (
    <div className="min-h-[100dvh] bg-bg-main text-text-main flex flex-col">
      <LandingNav />
      <LandingHero />
      <LandingBento />

      <div className="relative max-w-6xl w-full mx-auto px-4 sm:px-6 pb-20">
        <div aria-hidden="true" className="absolute -top-10 left-0 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <FaqList title={T.publicPages.faqTitle} lead={T.landing.faqLead} items={T.landing.faq} split />
        </div>
      </div>

      <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 pb-20">
        <LandingClosing />
      </section>

      <PublicFooter />

      <VersionBadge />
    </div>
  )
}
