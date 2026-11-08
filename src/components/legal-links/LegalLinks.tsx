'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import CookieSettingsButton from '@/components/cookie-settings-button/CookieSettingsButton'

/** The privacy policy, the terms and the way back to the cookie choice, for every footer. */
export default function LegalLinks() {
  const { T } = useLanguage()

  return (
    <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <Link href="/privacy" className="text-text-secondary hover:text-accent underline-offset-2 hover:underline transition-colors rounded focus-ring">
        {T.privacy.link}
      </Link>
      <Link href="/terms" className="text-text-secondary hover:text-accent underline-offset-2 hover:underline transition-colors rounded focus-ring">
        {T.terms.link}
      </Link>
      <CookieSettingsButton />
    </span>
  )
}
