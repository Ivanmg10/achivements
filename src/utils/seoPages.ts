import type { Metadata } from 'next'
import type { Lang } from '@/context/LanguageContext'
import { SEO_PAGES, type FaqItem, type SeoPageEntry, type SeoPageText, type SeoSection } from '@/translations/seoPages'

/** Where a page lives: /compare/exophase. */
export const seoPath = (page: SeoPageEntry): string => `/${page.section}/${page.slug}`

export const findSeoPage = (section: SeoSection, slug: string): SeoPageEntry | undefined =>
  SEO_PAGES.find((p) => p.section === section && p.slug === slug)

/** The page in the viewer's language, or in English when it has not been written in it. */
export const seoText = (page: SeoPageEntry, lang: Lang): SeoPageText => page.text[lang] ?? page.text.en

export const seoStaticParams = (section: SeoSection): { slug: string }[] =>
  SEO_PAGES.filter((p) => p.section === section).map((p) => ({ slug: p.slug }))

/** Title, description and canonical, in English: what search results show. */
export function seoMetadata(section: SeoSection, slug: string): Metadata {
  const page = findSeoPage(section, slug)
  if (!page) return {}
  const { title, description } = page.text.en
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: seoPath(page) },
    openGraph: { title, description, url: seoPath(page) },
  }
}

/** schema.org FAQPage for a list of questions; it must match the questions shown on the page. */
export const faqJsonLd = (items: FaqItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
})

/** JSON for a <script type="application/ld+json">, with `<` escaped so no text can close the tag. */
export const jsonLdString = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c')
