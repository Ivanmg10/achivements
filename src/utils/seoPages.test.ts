import { SEO_PAGES } from '@/translations/seoPages'
import { en } from '@/translations/en'
import { faqJsonLd, findSeoPage, jsonLdString, seoMetadata, seoPath, seoStaticParams, seoText } from './seoPages'

const exophase = findSeoPage('compare', 'exophase')!

test('a page lives under its section and slug', () => {
  expect(seoPath(exophase)).toBe('/compare/exophase')
  expect(findSeoPage('track', 'exophase')).toBeUndefined()
})

test('a language without its own copy falls back to English', () => {
  expect(seoText(exophase, 'es')).toBe(exophase.text.es)
  expect(seoText(exophase, 'ja')).toBe(exophase.text.en)
})

test('static params list only the section asked for', () => {
  expect(seoStaticParams('compare')).toEqual([{ slug: 'exophase' }, { slug: 'psnprofiles' }])
})

test('metadata is the English title as written, the description and the canonical path', () => {
  expect(seoMetadata('compare', 'exophase')).toMatchObject({
    title: { absolute: exophase.text.en.title },
    description: exophase.text.en.description,
    alternates: { canonical: '/compare/exophase' },
  })
  expect(seoMetadata('compare', 'nope')).toEqual({})
})

test('the FAQ becomes schema.org questions and answers', () => {
  expect(faqJsonLd([{ q: 'Free?', a: 'Yes.' }])).toEqual({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: 'Free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes.' } }],
  })
})

test('no text can close the script tag it is written into', () => {
  expect(jsonLdString({ a: '</script>' })).toBe('{"a":"\\u003c/script>"}')
})

describe('the copy', () => {
  const texts = SEO_PAGES.flatMap((p) => Object.values(p.text).map((t) => ({ path: seoPath(p), t: t! })))

  test('every page has a unique path and Spanish as well as English', () => {
    expect(new Set(SEO_PAGES.map(seoPath)).size).toBe(SEO_PAGES.length)
    for (const page of SEO_PAGES) expect(page.text.es).toBeDefined()
  })

  test('titles and descriptions fit what search results show', () => {
    for (const { path, t } of texts) {
      expect([path, t.title.length <= 70]).toEqual([path, true])
      expect([path, t.description.length <= 160]).toEqual([path, true])
      expect([path, t.faq.length > 0]).toEqual([path, true])
    }
  })

  test('never offers Xbox while it is admin-only: only as something Exophase has and we do not', () => {
    const rest = SEO_PAGES.map((p) =>
      p.slug === 'exophase' ? Object.values(p.text).map((t) => ({ ...t, sections: t!.sections.slice(1) })) : p,
    )
    expect(JSON.stringify(rest)).not.toMatch(/xbox/i)
    expect(JSON.stringify(en.landing.faq)).not.toMatch(/xbox/i)
  })
})
