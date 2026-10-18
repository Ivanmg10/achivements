'use client'

import { useLanguage } from '@/context/LanguageContext'
import PublicPageLinks from '@/components/public-page-links/PublicPageLinks'
import LegalLinks from '@/components/legal-links/LegalLinks'

/** The footer of the pages a visitor can open without an account: who we are not, and where else to read. */
export default function PublicFooter({ current, note }: { current?: string; note?: string }) {
  const { T } = useLanguage()

  return (
    <footer className="mt-auto px-6 py-6 flex flex-col items-center gap-2 text-center text-xs text-text-secondary">
      {note && <span>{note}</span>}
      <span>{T.landing.footer}</span>
      <PublicPageLinks current={current} />
      <LegalLinks />
    </footer>
  )
}
