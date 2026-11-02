import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminUnlock from './AdminUnlock'

const respond = (ok: boolean, body: unknown = {}) =>
  (global.fetch as jest.Mock).mockResolvedValue({ ok, json: () => Promise.resolve(body) })

function submit(password = 'secret12') {
  fireEvent.change(screen.getByLabelText('Your password'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))
}

beforeEach(() => {
  global.fetch = jest.fn()
})

test('asks for the code after the password, and sends both', async () => {
  respond(false, { error: 'totp-required' })
  render(<AdminUnlock onUnlocked={jest.fn()} />)
  submit()
  const code = await screen.findByLabelText(/Code from your authenticator/)
  respond(true, { ok: true })
  fireEvent.change(code, { target: { value: '123456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))
  await waitFor(() => expect(global.fetch).toHaveBeenLastCalledWith('/api/admin/unlock', expect.objectContaining({
    body: JSON.stringify({ password: 'secret12', code: '123456' }),
  })))
})

test('the first time it shows the key, and then the recovery codes before going on', async () => {
  respond(false, { error: 'totp-setup', key: 'ABC234', uri: 'otpauth://x' })
  const onUnlocked = jest.fn()
  render(<AdminUnlock onUnlocked={onUnlocked} />)
  submit()
  expect(await screen.findByText('ABC234')).toBeInTheDocument()
  respond(true, { ok: true, recoveryCodes: ['abcde-12345'] })
  fireEvent.change(screen.getByLabelText(/Code from your authenticator/), { target: { value: '123456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))
  expect(await screen.findByText('abcde-12345')).toBeInTheDocument()
  expect(onUnlocked).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'I have saved them' }))
  expect(onUnlocked).toHaveBeenCalled()
})

test('cannot be sent empty', () => {
  render(<AdminUnlock onUnlocked={jest.fn()} />)
  expect(screen.getByRole('button', { name: 'Unlock' })).toBeDisabled()
})

test('sends the password and reports the unlock', async () => {
  respond(true, { ok: true })
  const onUnlocked = jest.fn()
  render(<AdminUnlock onUnlocked={onUnlocked} />)
  submit()
  await waitFor(() => expect(onUnlocked).toHaveBeenCalled())
  expect(global.fetch).toHaveBeenCalledWith('/api/admin/unlock', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ password: 'secret12' }),
  }))
})

test.each([
  ['wrong-password', 'That password is incorrect.'],
  ['too-many-attempts', 'Too many wrong attempts. Wait 15 minutes and try again.'],
  ['anything-else', 'Could not unlock the panel. Try again.'],
])('a refusal (%s) is explained and nothing unlocks', async (code, message) => {
  respond(false, { error: code })
  const onUnlocked = jest.fn()
  render(<AdminUnlock onUnlocked={onUnlocked} />)
  submit()
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
  expect(onUnlocked).not.toHaveBeenCalled()
})
