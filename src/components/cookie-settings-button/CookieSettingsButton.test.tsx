import { render, screen, fireEvent } from '@testing-library/react'
import CookieSettingsButton from './CookieSettingsButton'
import CookieBanner from '@/components/cookie-banner/CookieBanner'
import { en } from '@/translations/en'

jest.mock('@/lib/analytics', () => ({ GA_ID: 'G-TEST', setAnalyticsEnabled: jest.fn() }))
const mockLib = jest.requireMock('@/lib/analytics') as { GA_ID: string }

beforeEach(() => {
  window.localStorage.clear()
  mockLib.GA_ID = 'G-TEST'
})

test('brings the banner back so the choice can be changed', () => {
  window.localStorage.setItem('cookie-consent', 'granted')
  render(<><CookieSettingsButton /><CookieBanner /></>)
  expect(screen.queryByRole('region')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: en.cookies.settings }))
  expect(screen.getByRole('region', { name: en.cookies.title })).toBeInTheDocument()
})

test('hidden when analytics is not configured', () => {
  mockLib.GA_ID = ''
  const { container } = render(<CookieSettingsButton />)
  expect(container).toBeEmptyDOMElement()
})
