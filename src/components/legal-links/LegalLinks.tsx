'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import CookieSettingsButton from '@/components/cookie-settings-button/CookieSettingsButton'

/** The privacy policy and the way back to the cookie choice, for every footer. */
export default function LegalLinks() {
  const { T } = useLanguage()

  return (
    <span className="flex items-center gap-3">
      <Link
        href="/privacy"
        className="text-text-secondary hover:text-accent underline-offset-2 hover:underline transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {T.privacy.link}
      </Link>
      <CookieSettingsButton />
    </span>
  )
}
