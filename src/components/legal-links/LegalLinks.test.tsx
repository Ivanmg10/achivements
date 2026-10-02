import { render, screen } from '@testing-library/react'
import LegalLinks from './LegalLinks'
import { en } from '@/translations/en'

jest.mock('@/lib/analytics', () => ({ GA_ID: 'G-TEST', setAnalyticsEnabled: jest.fn() }))
const mockLib = jest.requireMock('@/lib/analytics') as { GA_ID: string }

beforeEach(() => {
  mockLib.GA_ID = 'G-TEST'
})

test('links to the privacy policy and offers the cookie choice again', () => {
  render(<LegalLinks />)
  expect(screen.getByRole('link', { name: en.privacy.link })).toHaveAttribute('href', '/privacy')
  expect(screen.getByRole('link', { name: en.terms.link })).toHaveAttribute('href', '/terms')
  expect(screen.getByRole('button', { name: en.cookies.settings })).toBeInTheDocument()
})

test('the privacy link stays even without analytics', () => {
  mockLib.GA_ID = ''
  render(<LegalLinks />)
  expect(screen.getByRole('link', { name: en.privacy.link })).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
