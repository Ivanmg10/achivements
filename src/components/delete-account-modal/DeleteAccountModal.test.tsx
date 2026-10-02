import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { signOut } from 'next-auth/react'
import DeleteAccountModal from './DeleteAccountModal'
import { en } from '@/translations/en'

const D = en.deleteAccount
const respond = (ok: boolean, body: unknown = {}) =>
  (global.fetch as jest.Mock).mockResolvedValue({ ok, json: () => Promise.resolve(body) })

function typePassword(value = 'secret12') {
  fireEvent.change(screen.getByLabelText(D.password), { target: { value } })
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

test('says what it does, and cannot be confirmed without the password', () => {
  render(<DeleteAccountModal isOpen onClose={jest.fn()} />)
  expect(screen.getByText(D.confirmText)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: D.confirm })).toBeDisabled()
})

test('with the password, deletes the account and signs out to the landing page', async () => {
  respond(true, { ok: true })
  render(<DeleteAccountModal isOpen onClose={jest.fn()} />)
  typePassword()
  fireEvent.click(screen.getByRole('button', { name: D.confirm }))

  await waitFor(() => expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' }))
  expect(global.fetch).toHaveBeenCalledWith('/api/account', expect.objectContaining({
    method: 'DELETE',
    body: JSON.stringify({ currentPassword: 'secret12' }),
  }))
})

test.each([
  ['wrong-password', D.wrongPassword],
  ['too-many-attempts', D.tooManyAttempts],
  ['last-admin', D.lastAdmin],
  ['something-else', en.editProfileModal.errorGeneric],
])('a refusal (%s) is explained, and nobody is signed out', async (code, message) => {
  respond(false, { error: code })
  render(<DeleteAccountModal isOpen onClose={jest.fn()} />)
  typePassword()
  fireEvent.click(screen.getByRole('button', { name: D.confirm }))

  expect(await screen.findByRole('alert')).toHaveTextContent(message)
  expect(signOut).not.toHaveBeenCalled()
})

test('a network failure is explained too', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  render(<DeleteAccountModal isOpen onClose={jest.fn()} />)
  typePassword()
  fireEvent.click(screen.getByRole('button', { name: D.confirm }))
  expect(await screen.findByRole('alert')).toHaveTextContent(en.editProfileModal.errorGeneric)
})

test('cancel closes without deleting anything', () => {
  const onClose = jest.fn()
  render(<DeleteAccountModal isOpen onClose={onClose} />)
  typePassword()
  fireEvent.click(screen.getByRole('button', { name: en.editProfileModal.cancel }))
  expect(onClose).toHaveBeenCalled()
  expect(global.fetch).not.toHaveBeenCalled()
})
