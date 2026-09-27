import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResetPasswordForm from './ResetPasswordForm'
import { useSearchParams } from 'next/navigation'
import { en } from '@/translations/en'

jest.mock('next/navigation', () => ({ useSearchParams: jest.fn() }))

function withToken(token: string | null) {
  ;(useSearchParams as jest.Mock).mockReturnValue({ get: () => token })
  render(<ResetPasswordForm />)
}

function fill(password: string, confirm = password) {
  fireEvent.change(screen.getByLabelText(en.passwordReset.newPassword), { target: { value: password } })
  fireEvent.change(screen.getByLabelText(en.passwordReset.confirm), { target: { value: confirm } })
}

const save = () => fireEvent.click(screen.getByRole('button', { name: new RegExp(en.passwordReset.save) }))

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) })
})

test('a link without a token says so instead of showing a form', () => {
  withToken(null)
  expect(screen.getByRole('alert')).toHaveTextContent(en.passwordReset.missingToken)
  expect(screen.queryByLabelText(en.passwordReset.newPassword)).not.toBeInTheDocument()
})

test('sets the password and says it worked', async () => {
  withToken('tok')
  fill('secret12')
  save()

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(en.passwordReset.done))
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/auth/resetPassword')
  expect(JSON.parse(init.body)).toEqual({ token: 'tok', password: 'secret12' })
})

test('the two passwords have to match', () => {
  withToken('tok')
  fill('secret12', 'secret13')
  save()
  expect(screen.getByText(en.passwordReset.mismatch)).toBeInTheDocument()
  expect(global.fetch).not.toHaveBeenCalled()
})

test('a short password never reaches the server', () => {
  withToken('tok')
  fill('12345')
  save()
  expect(screen.getByLabelText(en.passwordReset.newPassword).getAttribute('aria-invalid')).toBe('true')
  expect(global.fetch).not.toHaveBeenCalled()
})

test('a spent or stale link is reported', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ error: 'invalid-token' }),
  })
  withToken('tok')
  fill('secret12')
  save()
  expect(await screen.findByRole('alert')).toHaveTextContent(en.passwordReset.invalidToken)
})

test('always offers the way back to signing in', () => {
  withToken('tok')
  expect(screen.getByRole('link', { name: en.passwordReset.backToSignIn }).getAttribute('href')).toBe('/authPage')
})
