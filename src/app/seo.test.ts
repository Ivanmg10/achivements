import robots from './robots'
import sitemap from './sitemap'
import { SITE_URL } from '@/lib/siteUrl'

test('robots keeps crawlers out of the API and points at the sitemap', () => {
  const r = robots()
  expect(r.rules).toEqual({ userAgent: '*', allow: '/', disallow: '/api/' })
  expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
})

test('the sitemap lists only the public pages, as absolute URLs', () => {
  expect(sitemap().map((e) => e.url)).toEqual([`${SITE_URL}/`, `${SITE_URL}/authPage`, `${SITE_URL}/privacy`, `${SITE_URL}/terms`])
})
