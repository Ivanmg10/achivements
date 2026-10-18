jest.mock('@/components/seo-page/SeoPage', () => ({
  __esModule: true,
  default: ({ page }: { page: { slug: string } }) => <div data-testid="page">{page.slug}</div>,
}))

import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import SeoPageRoute from './SeoPageRoute'
import { findSeoPage } from '@/utils/seoPages'

test('renders the page with its English FAQ as structured data', () => {
  const { container } = render(<SeoPageRoute section="compare" slug="exophase" />)
  expect(screen.getByTestId('page')).toHaveTextContent('exophase')
  const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.innerHTML)
  expect(ld['@type']).toBe('FAQPage')
  expect(ld.mainEntity.map((q: { name: string }) => q.name)).toEqual(findSeoPage('compare', 'exophase')!.text.en.faq.map((f) => f.q))
})

test('an unknown page is a 404', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<SeoPageRoute section="track" slug="exophase" />)).toThrow('NEXT_NOT_FOUND')
  expect(notFound).toHaveBeenCalled()
})
