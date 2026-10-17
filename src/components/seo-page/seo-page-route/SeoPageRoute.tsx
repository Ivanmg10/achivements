import { notFound } from 'next/navigation'
import type { SeoSection } from '@/translations/seoPages'
import { faqJsonLd, findSeoPage, jsonLdString } from '@/utils/seoPages'
import SeoPage from '@/components/seo-page/SeoPage'

/**
 * The server side of a public page: its FAQ as structured data (in English,
 * the language the server renders) and the page itself.
 */
export default function SeoPageRoute({ section, slug }: { section: SeoSection; slug: string }) {
  const page = findSeoPage(section, slug)
  if (!page) notFound()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd(page.text.en.faq)) }} />
      <SeoPage page={page} />
    </>
  )
}
