import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { signOut } from 'next-auth/react'
import { en } from '@/translations/en'
import ChangePasswordModal from './ChangePasswordModal'

const minLength = en.changePassword.minLength.replace('{min}', '8')

function fill(current: string, next: string, confirm = next) {
  fireEvent.change(screen.getByLabelText(en.changePassword.current), { target: { value: current } })
  fireEvent.change(screen.getByLabelText(en.changePassword.new), { target: { value: next } })
  fireEvent.change(screen.getByLabelText(en.changePassword.confirm), { target: { value: confirm } })
}

const save = () => fireEvent.click(screen.getByRole('button', { name: en.editProfileModal.save }))

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) })
})

test('the new password needs eight characters before it can be saved', () => {
  render(<ChangePasswordModal isOpen onClose={jest.fn()} />)
  fill('old-pass', '1234567')
  expect(screen.getByText(minLength)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: en.editProfileModal.save })).toBeDisabled()
})

test('a changed password signs out everywhere, this device included, and says so first', async () => {
  jest.useFakeTimers()
  render(<ChangePasswordModal isOpen onClose={jest.fn()} />)
  fill('old-pass', 'new-pass1')
  save()

  expect(await screen.findByRole('status')).toHaveTextContent(en.changePassword.changedSignIn)
  expect(signOut).not.toHaveBeenCalled()
  act(() => { jest.advanceTimersByTime(1500) })
  expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/authPage' })
  jest.useRealTimers()
})

test.each([
  ['wrong-password', en.changePassword.wrongPassword],
  ['too-many-attempts', en.changePassword.tooManyAttempts],
  ['anything-else', en.editProfileModal.errorGeneric],
])('a %s answer is shown in the visitor’s language, and nobody is signed out', async (code, message) => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: code }) })
  render(<ChangePasswordModal isOpen onClose={jest.fn()} />)
  fill('old-pass', 'new-pass1')
  save()
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
  expect(signOut).not.toHaveBeenCalled()
})

test('a network failure is reported', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValue(new Error('offline'))
  render(<ChangePasswordModal isOpen onClose={jest.fn()} />)
  fill('old-pass', 'new-pass1')
  save()
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(en.editProfileModal.errorGeneric))
})
