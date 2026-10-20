import { render, screen } from '@testing-library/react'
import PublicFooter from './PublicFooter'
import { en } from '@/translations/en'

test('says who it is not affiliated with, and links the public and legal pages', () => {
  render(<PublicFooter />)
  expect(screen.getByText(en.landing.footer)).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: en.publicPages.more })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.privacy.link })).toHaveAttribute('href', '/privacy')
})

test('adds the page note when there is one', () => {
  render(<PublicFooter note="Exophase is a trademark of its owner." />)
  expect(screen.getByText('Exophase is a trademark of its owner.')).toBeInTheDocument()
})
