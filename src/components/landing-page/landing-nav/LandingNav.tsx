'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

/**
 * The bar a visitor sees: the name, and the way in for anyone who already
 * has an account. The same floating, frosted shape as the app's own bar, so
 * signing in feels like stepping through rather than into another site. `wide`
 * is for a page whose content runs the full width (the rankings): the bar is as
 * wide as it and starts at the same edge.
 */
export default function LandingNav({ wide = false }: { wide?: boolean }) {
  const { T } = useLanguage()
  return (
    <div className={`sticky top-0 z-40 pt-2 ${wide ? 'px-4 sm:px-8' : 'px-2 sm:px-3'}`}>
      <nav
        aria-label={T.authPage.brand}
        className={`${wide ? 'w-full' : 'max-w-6xl mx-auto'} h-14 px-4 rounded-card flex items-center justify-between bg-bg-card/75 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-ink/[0.06] shadow-lg shadow-black/20`}
      >
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight rounded focus-ring"
        >
          {T.authPage.brand}
        </Link>
        <Link
          href="/authPage"
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-bg-main ring-1 ring-ink/10 hover:ring-ink/25 transition-shadow focus-ring"
        >
          {T.landing.signIn}
        </Link>
      </nav>
    </div>
  )
}
