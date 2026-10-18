import { render, screen } from '@testing-library/react'
import SeoPage from './SeoPage'
import { findSeoPage } from '@/utils/seoPages'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'
import { es } from '@/translations/es'

const page = findSeoPage('compare', 'psnprofiles')!

afterEach(() => (useLanguage as jest.Mock).mockReturnValue({ lang: 'en', setLang: jest.fn(), T: en }))

test('lays out the heading, each section, the FAQ and the way in', () => {
  render(<SeoPage page={page} />)
  const text = page.text.en
  expect(screen.getByRole('heading', { level: 1, name: text.heading })).toBeInTheDocument()
  for (const section of text.sections) {
    expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument()
  }
  expect(screen.getByRole('heading', { level: 2, name: en.publicPages.faqTitle })).toBeInTheDocument()
  expect(screen.getByText(text.faq[0].q)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: new RegExp(en.landing.createAccount) })).toHaveAttribute('href', '/authPage?mode=register')
  expect(screen.getByText(text.note!)).toBeInTheDocument()
})

test('links the other public pages, not itself', () => {
  render(<SeoPage page={page} />)
  expect(screen.queryByRole('link', { name: page.text.en.link })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'CheevoVault vs Exophase' })).toBeInTheDocument()
})

test('reads in Spanish for a Spanish viewer', () => {
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'es', setLang: jest.fn(), T: es })
  render(<SeoPage page={page} />)
  expect(screen.getByRole('heading', { level: 1, name: page.text.es!.heading })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: es.publicPages.faqTitle })).toBeInTheDocument()
})
