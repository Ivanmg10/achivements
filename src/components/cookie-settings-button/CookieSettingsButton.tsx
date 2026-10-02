'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { GA_ID } from '@/lib/analytics'

/** Brings the cookie banner back, so a choice can be withdrawn as easily as it was made. */
export default function CookieSettingsButton() {
  const { T } = useLanguage()
  const { choose } = useCookieConsent()

  if (!GA_ID) return null

  return (
    <button
      onClick={() => choose(null)}
      className="text-text-secondary hover:text-accent underline-offset-2 hover:underline transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      {T.cookies.settings}
    </button>
  )
}
