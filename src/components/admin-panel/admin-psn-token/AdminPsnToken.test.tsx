jest.mock('@/hooks/useAdminPsnToken', () => ({ useAdminPsnToken: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

import { render, screen, fireEvent } from '@testing-library/react'
import AdminPsnToken from './AdminPsnToken'
import { useAdminPsnToken } from '@/hooks/useAdminPsnToken'

const save = jest.fn()
const retry = jest.fn()

function set(overrides: Record<string, unknown> = {}) {
  ;(useAdminPsnToken as jest.Mock).mockReturnValue({
    status: { configured: true, stored: true, expiresAt: '2026-12-01T00:00:00Z', daysLeft: 40, updatedAt: null, updatedBy: 'ivan' },
    loadError: false, saving: false, saveError: null, save, retry, ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  set()
})

test('the PlayStation accounts are a list, one row for the app account today', () => {
  render(<AdminPsnToken />)
  expect(screen.getByRole('heading', { name: 'PlayStation accounts' })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
  expect(screen.getByText('40 days left')).toBeInTheDocument()
})

test('while the status loads, the row is a skeleton', () => {
  set({ status: null })
  render(<AdminPsnToken />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading')
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

test('a failed load can be retried', () => {
  set({ status: null, loadError: true })
  render(<AdminPsnToken />)
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(retry).toHaveBeenCalled()
})
