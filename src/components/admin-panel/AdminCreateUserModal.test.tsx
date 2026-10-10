jest.mock('@/utils/adminFetch', () => ({ adminFetch: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminCreateUserModal from './AdminCreateUserModal'
import { adminFetch } from '@/utils/adminFetch'
import { notify } from '@/lib/notify'
import { PASSWORD_MIN } from '@/utils/authValidation'

const GOOD_PASSWORD = 'x'.repeat(PASSWORD_MIN)
const reply = (body: unknown, ok = true) => Promise.resolve({ ok, status: ok ? 201 : 400, json: () => Promise.resolve(body) })

const username = () => screen.getByLabelText('Username *') as HTMLInputElement
const email = () => screen.getByLabelText('Email') as HTMLInputElement
const password = () => screen.getByLabelText('Password *') as HTMLInputElement
const submit = () => screen.getByRole('button', { name: /^Create$|Creating/ })

function setup() {
  const onClose = jest.fn()
  const onCreated = jest.fn()
  render(<AdminCreateUserModal isOpen onClose={onClose} onCreated={onCreated} />)
  return { onClose, onCreated }
}
const fill = (name = 'newbie', pass = GOOD_PASSWORD) => {
  fireEvent.change(username(), { target: { value: name } })
  fireEvent.change(password(), { target: { value: pass } })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(adminFetch as jest.Mock).mockImplementation(() => reply({ id: 9, username: 'newbie' }))
})

test('renders nothing while closed', () => {
  render(<AdminCreateUserModal isOpen={false} onClose={jest.fn()} onCreated={jest.fn()} />)
  expect(screen.queryByText('Create user')).not.toBeInTheDocument()
})

test('cannot be submitted until the username and a password of the length the server wants are given', () => {
  setup()
  expect(submit()).toBeDisabled()
  fill('ab', GOOD_PASSWORD)
  expect(submit()).toBeDisabled()
  fill('abc', 'x'.repeat(PASSWORD_MIN - 1))
  expect(submit()).toBeDisabled()
  expect(screen.getByText(`Minimum ${PASSWORD_MIN} characters`)).toBeInTheDocument()
  fill('abc', GOOD_PASSWORD)
  expect(submit()).toBeEnabled()
  expect(screen.queryByText(`Minimum ${PASSWORD_MIN} characters`)).not.toBeInTheDocument()
})

test('creates the user with what was typed, trimmed, and reports it', async () => {
  const { onCreated, onClose } = setup()
  fill('  newbie  ')
  fireEvent.change(email(), { target: { value: ' n@test.com ' } })
  fireEvent.click(screen.getByRole('switch', { name: 'Admin privileges' }))
  fireEvent.click(submit())

  await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ id: 9, username: 'newbie' }))
  const [url, init] = (adminFetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/admin/users')
  expect(init.method).toBe('POST')
  expect(JSON.parse(init.body)).toEqual({ username: 'newbie', email: 'n@test.com', password: GOOD_PASSWORD, admin: true })
  expect(notify.success).toHaveBeenCalledWith('newbie created')
  expect(onClose).toHaveBeenCalled()
})

test('an empty email is left out of the request, not sent as ""', async () => {
  setup()
  fill()
  fireEvent.click(submit())
  await waitFor(() => expect(adminFetch).toHaveBeenCalled())
  expect(JSON.parse((adminFetch as jest.Mock).mock.calls[0][1].body).email).toBeUndefined()
})

test('a refusal is shown next to the form and keeps it open, with what was typed', async () => {
  ;(adminFetch as jest.Mock).mockImplementation(() => reply({ error: 'Username already taken' }, false))
  const { onCreated, onClose } = setup()
  fill()
  fireEvent.click(submit())
  expect(await screen.findByRole('alert')).toHaveTextContent('Username already taken')
  expect(onCreated).not.toHaveBeenCalled()
  expect(onClose).not.toHaveBeenCalled()
  expect(username()).toHaveValue('newbie')
  expect(notify.error).not.toHaveBeenCalled()
})

test('a refusal with no message still says something', async () => {
  ;(adminFetch as jest.Mock).mockImplementation(() => reply({}, false))
  setup()
  fill()
  fireEvent.click(submit())
  expect(await screen.findByRole('alert')).toHaveTextContent('Error creating user')
})

test('a network failure says so instead of failing silently', async () => {
  ;(adminFetch as jest.Mock).mockRejectedValue(new Error('offline'))
  setup()
  fill()
  fireEvent.click(submit())
  expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')
  expect(submit()).toBeEnabled()
})

test('typing again clears the error', async () => {
  ;(adminFetch as jest.Mock).mockImplementation(() => reply({ error: 'Nope' }, false))
  setup()
  fill()
  fireEvent.click(submit())
  await screen.findByRole('alert')
  fireEvent.change(username(), { target: { value: 'other' } })
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('the password can be shown and hidden, and says which it is doing', () => {
  setup()
  expect(password()).toHaveAttribute('type', 'password')
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
  expect(password()).toHaveAttribute('type', 'text')
  expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true')
})

test('cancel closes and forgets what was typed', () => {
  const onClose = jest.fn()
  const { rerender } = render(<AdminCreateUserModal isOpen onClose={onClose} onCreated={jest.fn()} />)
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onClose).toHaveBeenCalled()
  rerender(<AdminCreateUserModal isOpen={false} onClose={onClose} onCreated={jest.fn()} />)
  rerender(<AdminCreateUserModal isOpen onClose={onClose} onCreated={jest.fn()} />)
  expect(username()).toHaveValue('')
  expect(password()).toHaveValue('')
})
