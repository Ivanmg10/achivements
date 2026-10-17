jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/components/main-page/MainPage', () => ({
  __esModule: true,
  default: () => <div data-testid="main-page">MainPage</div>,
}))
jest.mock('@/components/landing-page/LandingPage', () => ({
  __esModule: true,
  default: () => <div data-testid="landing">Landing</div>,
}))

import { render, screen } from '@testing-library/react'
import { getServerSession } from 'next-auth'
import Home from './page'
import { en } from '@/translations/en'

test('signed in, the home page is the app', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  render((await Home()) as React.ReactElement)
  expect(screen.getByTestId('main-page')).toBeInTheDocument()
  expect(screen.queryByTestId('landing')).not.toBeInTheDocument()
})

test('signed out, it explains what the app is instead', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  render((await Home()) as React.ReactElement)
  expect(screen.getByTestId('landing')).toBeInTheDocument()
  expect(screen.queryByTestId('main-page')).not.toBeInTheDocument()
})

test('signed out, it tells search engines what the app is and answers its FAQ', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const { container } = render((await Home()) as React.ReactElement)
  const ld = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.innerHTML))
  expect(ld.map((d) => d['@type'])).toEqual(['WebApplication', 'FAQPage'])
  expect(ld[1].mainEntity).toHaveLength(en.landing.faq.length)
})
