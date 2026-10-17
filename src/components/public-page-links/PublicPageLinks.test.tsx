import { render, screen } from '@testing-library/react'
import PublicPageLinks from './PublicPageLinks'
import { SEO_PAGES } from '@/translations/seoPages'
import { en } from '@/translations/en'

test('links every public page by its short label', () => {
  render(<PublicPageLinks />)
  expect(screen.getByRole('navigation', { name: en.publicPages.more })).toBeInTheDocument()
  expect(screen.getAllByRole('link')).toHaveLength(SEO_PAGES.length)
  expect(screen.getByRole('link', { name: 'CheevoVault vs Exophase' })).toHaveAttribute('href', '/compare/exophase')
})

test('leaves out the page it is on', () => {
  render(<PublicPageLinks current="/compare/exophase" />)
  expect(screen.queryByRole('link', { name: 'CheevoVault vs Exophase' })).not.toBeInTheDocument()
  expect(screen.getAllByRole('link')).toHaveLength(SEO_PAGES.length - 1)
})
