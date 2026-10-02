'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

/**
 * The bar a visitor sees: the name, and the way in for anyone who already
 * has an account. The same floating, frosted shape as the app's own bar, so
 * signing in feels like stepping through rather than into another site.
 */
export default function LandingNav() {
  const { T } = useLanguage()
  return (
    <div className="sticky top-0 z-40 px-2 sm:px-3 pt-2">
      <nav
        aria-label={T.authPage.brand}
        className="max-w-6xl mx-auto h-14 px-4 rounded-2xl flex items-center justify-between bg-bg-card/75 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-white/[0.06] shadow-lg shadow-black/20"
      >
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {T.authPage.brand}
        </Link>
        <Link
          href="/authPage"
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-bg-main ring-1 ring-white/10 hover:ring-white/25 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {T.landing.signIn}
        </Link>
      </nav>
    </div>
  )
}
