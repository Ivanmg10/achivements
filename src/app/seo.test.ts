jest.mock('next/og', () => ({
  ImageResponse: jest.fn(function (this: Record<string, unknown>, element: unknown, options: unknown) {
    this.element = element
    this.options = options
  }),
}))

import robots from './robots'
import sitemap from './sitemap'
import manifest from './manifest'
import AppleIcon, { size } from './apple-icon'
import { SITE_URL } from '@/lib/siteUrl'
import { SEO_PAGES } from '@/translations/seoPages'

test('robots keeps crawlers out of the API and points at the sitemap', () => {
  const r = robots()
  expect(r.rules).toEqual({ userAgent: '*', allow: '/', disallow: '/api/' })
  expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
})

test('the sitemap lists only the public pages, as absolute URLs', () => {
  expect(sitemap().map((e) => e.url)).toEqual([
    `${SITE_URL}/`,
    `${SITE_URL}/authPage`,
    `${SITE_URL}/privacy`,
    `${SITE_URL}/terms`,
    `${SITE_URL}/compare/exophase`,
    `${SITE_URL}/compare/psnprofiles`,
    `${SITE_URL}/track/retroachievements-steam-playstation`,
    `${SITE_URL}/track/achievements-with-friends`,
  ])
})

test('each comparison and how-to page says when its copy last changed', () => {
  const byUrl = Object.fromEntries(sitemap().map((e) => [e.url, e.lastModified]))
  for (const page of SEO_PAGES) {
    expect(byUrl[`${SITE_URL}/${page.section}/${page.slug}`]).toEqual(new Date(page.updated))
  }
})

test('the legal pages say when they last changed', () => {
  const byUrl = Object.fromEntries(sitemap().map((e) => [e.url, e.lastModified]))
  expect(byUrl[`${SITE_URL}/privacy`]).toEqual(new Date('2026-10-13'))
  expect(byUrl[`${SITE_URL}/terms`]).toEqual(new Date('2026-10-09'))
})

test('the manifest names the app and points at both icons', () => {
  const m = manifest()
  expect(m).toMatchObject({ short_name: 'CheevoVault', start_url: '/', display: 'standalone' })
  expect(m.icons?.map((i) => i.src)).toEqual(['/icon.svg', '/apple-icon'])
})

test('the iOS icon is a 180px square with the same CH as the favicon', () => {
  expect(size).toEqual({ width: 180, height: 180 })
  const icon = AppleIcon() as unknown as { element: { props: { children: string } }; options: unknown }
  expect(icon.element.props.children).toBe('CH')
  expect(icon.options).toEqual(size)
})
