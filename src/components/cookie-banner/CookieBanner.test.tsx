import { render, screen, fireEvent } from '@testing-library/react'
import CookieBanner from './CookieBanner'
import { en } from '@/translations/en'

jest.mock('@/lib/analytics', () => ({ GA_ID: 'G-TEST', setAnalyticsEnabled: jest.fn() }))
const mockLib = jest.requireMock('@/lib/analytics') as { GA_ID: string; setAnalyticsEnabled: jest.Mock }

beforeEach(() => {
  window.localStorage.clear()
  mockLib.GA_ID = 'G-TEST'
  jest.clearAllMocks()
})

test('asks, with accept and reject side by side', () => {
  render(<CookieBanner />)
  expect(screen.getByRole('region', { name: en.cookies.title })).toHaveTextContent(en.cookies.text)
  expect(screen.getByRole('button', { name: en.cookies.accept })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: en.cookies.reject })).toBeInTheDocument()
})

test('links to the privacy policy before asking', () => {
  render(<CookieBanner />)
  expect(screen.getByRole('link', { name: en.privacy.link })).toHaveAttribute('href', '/privacy')
})

test('accepting turns analytics on and the banner goes away', () => {
  render(<CookieBanner />)
  fireEvent.click(screen.getByRole('button', { name: en.cookies.accept }))
  expect(mockLib.setAnalyticsEnabled).toHaveBeenCalledWith(true)
  expect(screen.queryByRole('region')).not.toBeInTheDocument()
})

test('rejecting keeps analytics off and the banner goes away', () => {
  render(<CookieBanner />)
  fireEvent.click(screen.getByRole('button', { name: en.cookies.reject }))
  expect(mockLib.setAnalyticsEnabled).toHaveBeenCalledWith(false)
  expect(screen.queryByRole('region')).not.toBeInTheDocument()
})

test('does not ask again once answered', () => {
  window.localStorage.setItem('cookie-consent', 'denied')
  const { container } = render(<CookieBanner />)
  expect(container).toBeEmptyDOMElement()
})

test('without analytics configured there is nothing to ask', () => {
  mockLib.GA_ID = ''
  const { container } = render(<CookieBanner />)
  expect(container).toBeEmptyDOMElement()
})
