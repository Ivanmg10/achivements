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
