jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { notify } from '@/lib/notify'
import AdminPsnRenewModal from './AdminPsnRenewModal'

const NPSSO = 'd'.repeat(64)
const OK = { ok: true as const, data: { onlineId: 'ServiceTwo', expiresAt: '2027-01-10T00:00:00.000Z' } }

function setup(account?: { id: number; label: string; hint: string | null }) {
  const onAdd = jest.fn(async () => OK)
  const onRenew = jest.fn(async () => OK)
  const onClose = jest.fn()
  render(<AdminPsnRenewModal isOpen onClose={onClose} account={account} onAdd={onAdd} onRenew={onRenew} />)
  return { onAdd, onRenew, onClose }
}

beforeEach(() => jest.clearAllMocks())

test('renewing walks through the three steps, naming the account and its hint', () => {
  setup({ id: 2, label: 'PSN-2', hint: 'the blue one' })
  expect(screen.getByText('Renew PSN-2')).toBeInTheDocument()
  expect(screen.getByText('1. Open a private window')).toBeInTheDocument()
  expect(screen.getByText(/the blue one/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /playstation\.com/ })).toHaveAttribute('href', 'https://www.playstation.com/')
  expect(screen.getByRole('link', { name: /ssocookie/ })).toHaveAttribute('href', 'https://ca.account.sony.com/api/v1/ssocookie')
  expect(screen.getByLabelText('NPSSO')).toHaveAttribute('type', 'password')
})

test('the pasted NPSSO is tested and saved; the dialog closes with a toast', async () => {
  const { onRenew, onClose } = setup({ id: 2, label: 'PSN-2', hint: null })
  const save = screen.getByRole('button', { name: 'Test and save' })
  expect(save).toBeDisabled()
  fireEvent.change(screen.getByLabelText('NPSSO'), { target: { value: ` ${NPSSO} ` } })
  fireEvent.click(save)
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(onRenew).toHaveBeenCalledWith(2, NPSSO)
  expect(notify.success).toHaveBeenCalledWith(expect.stringContaining('PSN-2 signed in as ServiceTwo'))
})

test('what Sony refuses stays open with the reason beside it', async () => {
  const { onRenew, onClose } = setup({ id: 2, label: 'PSN-2', hint: null })
  onRenew.mockResolvedValueOnce({ ok: false, error: 'rejected' } as never)
  fireEvent.change(screen.getByLabelText('NPSSO'), { target: { value: NPSSO } })
  fireEvent.click(screen.getByRole('button', { name: 'Test and save' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Sony did not take it')
  expect(onClose).not.toHaveBeenCalled()
})

test('adding asks for the label, a hint and the weight too', async () => {
  const { onAdd } = setup()
  expect(screen.getByText('Add a PlayStation account')).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText(/^Label/), { target: { value: 'PSN-3' } })
  fireEvent.change(screen.getByLabelText(/^Hint/), { target: { value: 'green' } })
  expect(screen.getByText('PSN-3', { selector: 'strong' })).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('NPSSO'), { target: { value: NPSSO } })
  fireEvent.click(screen.getByRole('button', { name: 'Test and save' }))
  await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ label: 'PSN-3', hint: 'green', weight: 1, npsso: NPSSO }))
})
