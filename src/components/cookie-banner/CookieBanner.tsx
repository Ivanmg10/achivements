'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { GA_ID } from '@/lib/analytics'

const BUTTON =
  'flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/**
 * Asks before any analytics cookie is set. Rejecting is exactly as easy as
 * accepting — same size, same place — as the AEPD requires.
 */
export default function CookieBanner() {
  const { T } = useLanguage()
  const { consent, choose } = useCookieConsent()

  if (!GA_ID || consent !== null) return null

  return (
    <section
      aria-label={T.cookies.title}
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md"
    >
      <div className="flex flex-col gap-3 bg-bg-card border border-white/10 rounded-2xl p-4 shadow-2xl">
        <p className="text-sm font-semibold text-text-main">{T.cookies.title}</p>
        <p className="text-xs text-text-secondary">
          {T.cookies.text}{' '}
          <Link href="/privacy" className="text-accent underline-offset-2 hover:underline">{T.privacy.link}</Link>
        </p>
        <div className="flex gap-2">
          <button onClick={() => choose('denied')} className={`${BUTTON} bg-white/10 text-text-main hover:bg-white/15`}>
            {T.cookies.reject}
          </button>
          <button onClick={() => choose('granted')} className={`${BUTTON} bg-accent text-bg-main hover:opacity-90`}>
            {T.cookies.accept}
          </button>
        </div>
      </div>
    </section>
  )
}
