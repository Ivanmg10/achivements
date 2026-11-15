jest.mock('@/hooks/useAdminPsnAccounts', () => ({ useAdminPsnAccounts: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAdminPsnAccounts } from '@/hooks/useAdminPsnAccounts'
import { notify } from '@/lib/notify'
import AdminPsnAccounts from './AdminPsnAccounts'
import { NOW, psnAccount, psnStatus } from '@/test-utils/psnPoolFixtures'

const ok = <T,>(data: T) => ({ ok: true as const, data })
let hook: Record<string, jest.Mock | unknown>

beforeEach(() => {
  jest.clearAllMocks()
  hook = {
    status: psnStatus([psnAccount(), psnAccount({ id: 2, label: 'PSN-2', status: 'paused' })]),
    loadedAt: NOW,
    loadError: false,
    retry: jest.fn(),
    add: jest.fn(),
    renew: jest.fn(),
    test: jest.fn(async () => ok({ onlineId: 'ServiceOne', ms: 210 })),
    update: jest.fn(async () => ok({ ok: true })),
    remove: jest.fn(async () => ok({ ok: true })),
  }
  ;(useAdminPsnAccounts as jest.Mock).mockImplementation(() => hook)
})

test('one row per account, under the pool at a glance', () => {
  render(<AdminPsnAccounts />)
  expect(screen.getByText('PSN-1')).toBeInTheDocument()
  expect(screen.getByText('PSN-2')).toBeInTheDocument()
  expect(screen.getByText(/1 of 2 usable/)).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(/Next renewal: PSN-1/)
})

test('loading, a failed load with its retry, and an empty pool', () => {
  hook.status = null
  const { rerender } = render(<AdminPsnAccounts />)
  expect(screen.getByText('Loading…')).toBeInTheDocument()
  hook.loadError = true
  rerender(<AdminPsnAccounts />)
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(hook.retry).toHaveBeenCalled()
  hook.loadError = false
  hook.status = psnStatus([])
  rerender(<AdminPsnAccounts />)
  expect(screen.getByText(/No account yet/)).toBeInTheDocument()
})

test('Test says how it went in a toast', async () => {
  render(<AdminPsnAccounts />)
  fireEvent.click(screen.getAllByRole('button', { name: 'Test' })[0])
  await waitFor(() => expect(notify.success).toHaveBeenCalledWith('PSN-1 works: signed in as ServiceOne, 210 ms'))
  ;(hook.test as jest.Mock).mockResolvedValueOnce({ ok: false, error: 'auth' })
  fireEvent.click(screen.getAllByRole('button', { name: 'Test' })[0])
  await waitFor(() => expect(notify.error).toHaveBeenCalledWith('Testing PSN-1 failed. Sony refused its sign-in: renew it.'))
})

test('Drain, Pause and Resume change the state', async () => {
  render(<AdminPsnAccounts />)
  fireEvent.click(screen.getByRole('button', { name: 'Drain' }))
  await waitFor(() => expect(hook.update).toHaveBeenCalledWith(1, { status: 'draining' }))
  fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
  await waitFor(() => expect(hook.update).toHaveBeenCalledWith(2, { status: 'active' }))
  ;(hook.update as jest.Mock).mockResolvedValueOnce({ ok: false, error: 'not-found' })
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
  await waitFor(() => expect(notify.error).toHaveBeenCalledWith('Changing PSN-1 failed. That account is gone.'))
})

test('Remove asks first', async () => {
  render(<AdminPsnAccounts />)
  fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[1])
  fireEvent.click(await screen.findByRole('button', { name: 'Remove account' }, { timeout: 5000 }))
  await waitFor(() => expect(hook.remove).toHaveBeenCalledWith(2))
  expect(notify.success).toHaveBeenCalledWith('PSN-2 removed, with its sign-in')
})

test('Renew and Add account open the guided dialog', async () => {
  render(<AdminPsnAccounts />)
  fireEvent.click(screen.getAllByRole('button', { name: 'Renew' })[0])
  expect(await screen.findByText('Renew PSN-1', {}, { timeout: 5000 })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  fireEvent.click(screen.getByRole('button', { name: /Add account/ }))
  expect(await screen.findByText('Add a PlayStation account', {}, { timeout: 5000 })).toBeInTheDocument()
})
