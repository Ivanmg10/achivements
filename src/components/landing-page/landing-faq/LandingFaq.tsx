'use client'

import { useLanguage } from '@/context/LanguageContext'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'

/**
 * The questions people ask first, all open in two columns (nothing to click, and all of it in the server's
 * HTML for search engines). The same list, `T.landing.faq`, is the page's `FAQPage` JSON-LD
 * (`app/(main)/(home)/page.tsx`, from the English items), so what is marked up is what is shown.
 */
export default function LandingFaq() {
  const { T } = useLanguage()

  return (
    <section id="faq" aria-labelledby="landing-faq-title" className="grid gap-8 lg:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)] lg:gap-18 scroll-mt-6">
      <LandingSectionHead id="landing-faq-title" title={T.publicPages.faqTitle} text={T.landing.faqLead} />
      <dl className="grid gap-x-14 gap-y-6 md:grid-cols-2 lg:gap-y-9">
        {T.landing.faq.map((item) => (
          <div key={item.q} className="flex flex-col gap-2 pt-4 shadow-hairline-t">
            <dt className="text-base lg:text-[1.1875rem] font-bold">{item.q}</dt>
            <dd className="text-sm lg:text-base leading-relaxed text-text-secondary">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
