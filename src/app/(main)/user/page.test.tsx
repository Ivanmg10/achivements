jest.mock('@/components/user-data/UserData', () => ({
  __esModule: true,
  default: () => <div data-testid="user-data">UserData</div>,
}))

jest.mock('@/components/user-stats/UserStats', () => ({
  __esModule: true,
  default: () => <div data-testid="user-stats">UserStats</div>,
}))

jest.mock('@/components/admin-panel/AdminPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-panel">AdminPanel</div>,
}))

import { render, screen } from '@testing-library/react'
import UserPage from './page'
import { useSession } from 'next-auth/react'

test('renders user page sections', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  render(<UserPage />)
  expect(screen.getByTestId('user-data')).toBeInTheDocument()
  expect(screen.getByTestId('user-stats')).toBeInTheDocument()
})

test('renders admin panel when user is admin', () => {
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { admin: true } },
  })
  render(<UserPage />)
  expect(screen.getByTestId('admin-panel')).toBeInTheDocument()
})
