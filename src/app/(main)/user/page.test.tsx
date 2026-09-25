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

import { render, screen } from '@testing-library/react'
import UserPage from './page'
import { useSession } from 'next-auth/react'

test('shows identity, preferences and the platforms, in that order', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  const { container } = render(<UserPage />)

  expect(screen.getByTestId('identity')).toBeInTheDocument()
  expect(screen.getByTestId('preferences')).toBeInTheDocument()
  const order = Array.from(container.querySelectorAll('[data-testid]')).map((el) => el.getAttribute('data-testid'))
  expect(order).toEqual(['identity', 'preferences', 'platforms'])
})

test('the admin panel is only for admins, and comes last', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: {} } })
  const { rerender, container } = render(<UserPage />)
  expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument()

  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { admin: true } } })
  rerender(<UserPage />)
  const ids = Array.from(container.querySelectorAll('[data-testid]')).map((el) => el.getAttribute('data-testid'))
  expect(ids[ids.length - 1]).toBe('admin-panel')
})
