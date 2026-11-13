import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminPsnAccountRow from './AdminPsnAccountRow'
import { notify } from '@/lib/notify'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const STATUS = { configured: true, stored: true, expiresAt: '2026-12-01T00:00:00Z', daysLeft: 40, updatedAt: null, updatedBy: 'ivan' }
const row = (over: Record<string, unknown> = {}, onSave = jest.fn().mockResolvedValue(true)) => {
  render(
    <ul>
      <AdminPsnAccountRow name="App account" status={STATUS} saving={false} saveError={null} onSave={onSave} {...over} />
    </ul>,
  )
  return onSave
}

test('says who, how long it has left and who set it', () => {
  row()
  expect(screen.getByText('App account')).toBeInTheDocument()
  expect(screen.getByText('40 days left')).toBeInTheDocument()
  expect(screen.getByText(/set by ivan/)).toBeInTheDocument()
})

test('the field for a new NPSSO opens from the row, and saving closes it and says so', async () => {
  const onSave = row()
  expect(screen.queryByLabelText(/New NPSSO/)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Renew' }))
  expect(screen.getByRole('link', { name: /this page/ })).toHaveAttribute('href', 'https://ca.account.sony.com/api/v1/ssocookie')
  fireEvent.change(screen.getByLabelText(/New NPSSO/), { target: { value: ' abc ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(notify.success).toHaveBeenCalled())
  expect(onSave).toHaveBeenCalledWith('abc')
  expect(screen.queryByLabelText(/New NPSSO/)).not.toBeInTheDocument()
})

test('a refused one stays open and says why; cancelling closes the field', () => {
  row({ saveError: 'rejected' })
  fireEvent.click(screen.getByRole('button', { name: 'Renew' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Sony did not accept it')
  expect(screen.getByLabelText(/New NPSSO/)).toHaveAttribute('aria-invalid', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByLabelText(/New NPSSO/)).not.toBeInTheDocument()
})

test('expired is said plainly', () => {
  row({ status: { ...STATUS, daysLeft: 0, expiresAt: null, updatedBy: null } })
  expect(screen.getByText('Expired')).toBeInTheDocument()
})

test('not set up offers to set it up', () => {
  row({ status: { configured: false, stored: false, expiresAt: null, daysLeft: null, updatedAt: null, updatedBy: null } })
  expect(screen.getByText(/Not set up/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Set up' })).toBeInTheDocument()
})
