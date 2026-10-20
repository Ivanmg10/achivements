jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/components/not-found-in-app/NotFoundInApp', () => ({
  __esModule: true,
  default: () => <div data-testid="in-app" />,
}))
jest.mock('@/components/not-found-screen/NotFoundScreen', () => ({
  __esModule: true,
  default: ({ fullScreen }: { fullScreen?: boolean }) => <div data-testid="screen" data-full={String(!!fullScreen)} />,
}))

import { render, screen } from '@testing-library/react'
import { getServerSession } from 'next-auth'
import MainNotFound from './not-found'

test('signed in, the 404 goes under the header', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  render(await MainNotFound())
  expect(screen.getByTestId('in-app')).toBeInTheDocument()
})

test('signed out there is no layout, so it takes the whole screen', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  render(await MainNotFound())
  expect(screen.getByTestId('screen')).toHaveAttribute('data-full', 'true')
})
