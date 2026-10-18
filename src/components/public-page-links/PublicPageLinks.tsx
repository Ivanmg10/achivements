'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { SEO_PAGES } from '@/translations/seoPages'
import { seoPath, seoText } from '@/utils/seoPages'

/** Links to the public comparison and how-to pages, so visitors and crawlers find them from any of them. */
export default function PublicPageLinks({ current }: { current?: string }) {
  const { lang, T } = useLanguage()
  const pages = SEO_PAGES.filter((p) => seoPath(p) !== current)

  return (
    <nav aria-label={T.publicPages.more} className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      {pages.map((page) => (
        <Link
          key={seoPath(page)}
          href={seoPath(page)}
          className="text-text-secondary hover:text-accent underline-offset-2 hover:underline transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {seoText(page, lang).link}
        </Link>
      ))}
    </nav>
  )
}
