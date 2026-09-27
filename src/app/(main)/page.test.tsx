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
