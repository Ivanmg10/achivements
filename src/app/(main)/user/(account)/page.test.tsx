jest.mock('@/components/user-page/user-identity-card/UserIdentityCard', () => ({
  __esModule: true,
  default: () => <div data-testid="identity" />,
}))
jest.mock('@/components/user-page/user-preferences-card/UserPreferencesCard', () => ({
  __esModule: true,
  default: () => <div data-testid="preferences" />,
}))
jest.mock('@/components/user-page/user-platforms/UserPlatforms', () => ({
  __esModule: true,
  default: () => <div data-testid="platforms" />,
}))
jest.mock('@/components/admin-panel/AdminPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-panel" />,
}))
jest.mock('@/components/user-page/delete-account-card/DeleteAccountCard', () => ({
  __esModule: true,
  default: () => <div data-testid="delete-account" />,
}))
jest.mock('@/components/user-page/user-page-skeleton/UserPageSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton" />,
}))

import { render, screen } from '@testing-library/react'
import UserPage from './page'
import { useSession } from 'next-auth/react'

test('shows identity and deleting the account, then preferences, then the platforms', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  const { container } = render(<UserPage />)

  expect(screen.getByTestId('identity')).toBeInTheDocument()
  expect(screen.getByTestId('preferences')).toBeInTheDocument()
  const order = Array.from(container.querySelectorAll('[data-testid]')).map((el) => el.getAttribute('data-testid'))
  expect(order).toEqual(['identity', 'delete-account', 'preferences', 'platforms'])
})

test('holds the skeleton until the session is known: it decides the shape of the page', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'loading', data: null })
  render(<UserPage />)
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  expect(screen.queryByTestId('identity')).not.toBeInTheDocument()
})

test('shows the page once it is', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { name: 'ivan' } } })
  render(<UserPage />)
  expect(screen.getByTestId('identity')).toBeInTheDocument()
  expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
})

test('it enters slowly: it waits for nothing, so no skeleton softens its arrival', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { name: 'ivan' } } })
  const { container } = render(<UserPage />)
  expect(container.querySelector('main')).toHaveClass('enter-slow')
})

test('update() refreshing the session does not send the page back to its skeleton', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'loading', data: { user: { name: 'ivan' } } })
  render(<UserPage />)
  expect(screen.getByTestId('identity')).toBeInTheDocument()
})

test('the admin panel is not laid out on the page, even for admins: it opens from the top card', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { admin: true } } })
  render(<UserPage />)
  expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument()
})
