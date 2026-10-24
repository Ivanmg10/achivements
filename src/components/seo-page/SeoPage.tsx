'use client'

import type { SeoPageEntry } from '@/translations/seoPages'
import { useLanguage } from '@/context/LanguageContext'
import { seoPath, seoText } from '@/utils/seoPages'
import LandingNav from '@/components/landing-page/landing-nav/LandingNav'
import LandingClosing from '@/components/landing-page/landing-closing/LandingClosing'
import FaqList from '@/components/faq-list/FaqList'
import PublicFooter from '@/components/public-footer/PublicFooter'

/**
 * A public page that answers one question a visitor (or an AI) asks about
 * CheevoVault: a comparison or a how-to. In the viewer's language when it is
 * written in it, otherwise in English.
 */
export default function SeoPage({ page }: { page: SeoPageEntry }) {
  const { lang, T } = useLanguage()
  const text = seoText(page, lang)

  return (
    <div className="min-h-[100dvh] bg-bg-main text-text-main flex flex-col">
      <LandingNav />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[0.95] pr-1">{text.heading}</h1>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">{text.intro}</p>
        </header>

        {text.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{section.heading}</h2>
            {section.text && <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{section.text}</p>}
            {section.points && (
              <ul className="flex flex-col gap-2 list-disc pl-5 marker:text-accent">
                {section.points.map((point) => (
                  <li key={point} className="text-sm sm:text-base text-text-secondary leading-relaxed">{point}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <FaqList title={T.publicPages.faqTitle} items={text.faq} />

        <LandingClosing />
      </main>

      <PublicFooter current={seoPath(page)} note={text.note} />
    </div>
  )
}
