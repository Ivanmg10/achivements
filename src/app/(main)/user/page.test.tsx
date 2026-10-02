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

import { render, screen } from '@testing-library/react'
import UserPage from './page'
import { useSession } from 'next-auth/react'

test('shows identity, preferences, the platforms and deleting the account, in that order', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  const { container } = render(<UserPage />)

  expect(screen.getByTestId('identity')).toBeInTheDocument()
  expect(screen.getByTestId('preferences')).toBeInTheDocument()
  const order = Array.from(container.querySelectorAll('[data-testid]')).map((el) => el.getAttribute('data-testid'))
  expect(order).toEqual(['identity', 'preferences', 'platforms', 'delete-account'])
})

test('the admin panel is only for admins, just before deleting the account', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: {} } })
  const { rerender, container } = render(<UserPage />)
  expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument()

  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { admin: true } } })
  rerender(<UserPage />)
  const ids = Array.from(container.querySelectorAll('[data-testid]')).map((el) => el.getAttribute('data-testid'))
  expect(ids.slice(-2)).toEqual(['admin-panel', 'delete-account'])
})
