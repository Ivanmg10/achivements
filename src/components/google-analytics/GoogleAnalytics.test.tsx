import { render } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import GoogleAnalytics from './GoogleAnalytics'

jest.mock('@/lib/analytics', () => ({
  GA_ID: 'G-TEST',
  setAnalyticsEnabled: jest.fn(),
  pageLocation: () => 'https://www.cheevovault.com/resetPassword',
}))
const mockLib = jest.requireMock('@/lib/analytics') as { GA_ID: string }
jest.mock('next/navigation', () => ({ usePathname: jest.fn(() => '/') }))
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ src }: { src: string }) => <script data-src={src} />,
}))

type W = { dataLayer?: IArguments[]; gtag?: unknown }
const w = window as unknown as W
const configs = () => (w.dataLayer ?? []).map((a) => Array.from(a)).filter((a) => a[0] === 'config')

beforeEach(() => {
  window.localStorage.clear()
  mockLib.GA_ID = 'G-TEST'
  delete w.dataLayer
  delete w.gtag
})

test('loads nothing until cookies are accepted', () => {
  const { container } = render(<GoogleAnalytics />)
  expect(container).toBeEmptyDOMElement()
  expect(w.dataLayer).toBeUndefined()
})

test('loads nothing after a rejection', () => {
  window.localStorage.setItem('cookie-consent', 'denied')
  const { container } = render(<GoogleAnalytics />)
  expect(container).toBeEmptyDOMElement()
})

test('once accepted, loads the tag and reports the page without its query', () => {
  window.localStorage.setItem('cookie-consent', 'granted')
  const { container } = render(<GoogleAnalytics />)
  expect(container.querySelector('script')?.getAttribute('data-src')).toBe(
    'https://www.googletagmanager.com/gtag/js?id=G-TEST',
  )
  expect(configs()).toEqual([['config', 'G-TEST', { page_location: 'https://www.cheevovault.com/resetPassword' }]])
})

test('reports each navigation once', () => {
  window.localStorage.setItem('cookie-consent', 'granted')
  const { rerender } = render(<GoogleAnalytics />)
  ;(usePathname as jest.Mock).mockReturnValue('/groups')
  rerender(<GoogleAnalytics />)
  expect(configs()).toHaveLength(2)
})

test('without an ID nothing loads even after accepting', () => {
  mockLib.GA_ID = ''
  window.localStorage.setItem('cookie-consent', 'granted')
  const { container } = render(<GoogleAnalytics />)
  expect(container).toBeEmptyDOMElement()
})
