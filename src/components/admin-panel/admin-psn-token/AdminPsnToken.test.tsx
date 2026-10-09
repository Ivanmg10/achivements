jest.mock('@/hooks/useAdminPsnToken', () => ({ useAdminPsnToken: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminPsnToken from './AdminPsnToken'
import { useAdminPsnToken } from '@/hooks/useAdminPsnToken'
import { notify } from '@/lib/notify'

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

test('says how long the sign-in has left, and who set it', () => {
  render(<AdminPsnToken />)
  expect(screen.getByText('40 days left')).toBeInTheDocument()
  expect(screen.getByText(/set by ivan/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /this page/ })).toHaveAttribute('href', 'https://ca.account.sony.com/api/v1/ssocookie')
})

test('expired and not set up are said plainly', () => {
  set({ status: { configured: true, stored: true, expiresAt: null, daysLeft: 0, updatedAt: null, updatedBy: null } })
  const { rerender } = render(<AdminPsnToken />)
  expect(screen.getByText('Expired')).toBeInTheDocument()
  set({ status: { configured: false, stored: false, expiresAt: null, daysLeft: null, updatedAt: null, updatedBy: null } })
  rerender(<AdminPsnToken />)
  expect(screen.getByText(/Not set up/)).toBeInTheDocument()
})

test('saving a new one clears the box and says so', async () => {
  save.mockResolvedValue(true)
  render(<AdminPsnToken />)
  const box = screen.getByLabelText(/New NPSSO/)
  fireEvent.change(box, { target: { value: ' abc ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(notify.success).toHaveBeenCalled())
  expect(save).toHaveBeenCalledWith('abc')
  expect(box).toHaveValue('')
})

test('a refused one says why, next to the box', () => {
  set({ saveError: 'rejected' })
  render(<AdminPsnToken />)
  expect(screen.getByRole('alert')).toHaveTextContent('Sony did not accept it')
  expect(screen.getByLabelText(/New NPSSO/)).toHaveAttribute('aria-invalid', 'true')
})

test('a failed load can be retried', () => {
  set({ status: null, loadError: true })
  render(<AdminPsnToken />)
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(retry).toHaveBeenCalled()
})
