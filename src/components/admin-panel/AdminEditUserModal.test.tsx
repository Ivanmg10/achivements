jest.mock('@/utils/adminFetch', () => ({ adminFetch: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
jest.mock('./admin-linked-accounts/AdminLinkedAccounts', () => ({
  __esModule: true,
  default: () => <div data-testid="linked-accounts" />,
}))

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import AdminEditUserModal from './AdminEditUserModal'
import { adminFetch } from '@/utils/adminFetch'
import { notify } from '@/lib/notify'
import type { AdminUser } from '@/types/user'

const USER = { id: 11, username: 'bob', email: 'bob@test.com', avatar: null, location: 'ES', admin: false } as unknown as AdminUser
const reply = (body: unknown, ok = true) => Promise.resolve({ ok, status: ok ? 200 : 400, json: () => Promise.resolve(body) })

function setup(user: AdminUser = USER, currentAdminId = 3) {
  const onUpdated = jest.fn()
  const onChanged = jest.fn()
  const onClose = jest.fn()
  render(<AdminEditUserModal isOpen onClose={onClose} user={user} onUpdated={onUpdated} onChanged={onChanged} currentAdminId={currentAdminId} />)
  return { onUpdated, onChanged, onClose }
}

const row = (label: string) => screen.getByText(label).closest('div.flex.flex-col') as HTMLElement
const saveIn = (label: string) => within(row(label)).getByRole('button', { name: /Save|\.\.\./ })
const sent = () => JSON.parse((adminFetch as jest.Mock).mock.calls.at(-1)[1].body)

beforeEach(() => {
  jest.clearAllMocks()
  ;(adminFetch as jest.Mock).mockImplementation(() => reply({ ok: true }))
})

test('shows who is being edited, and the linked accounts', () => {
  setup()
  expect(screen.getByRole('heading', { name: 'bob' })).toBeInTheDocument()
  expect(screen.getByText('ID: 11')).toBeInTheDocument()
  expect(screen.getByTestId('linked-accounts')).toBeInTheDocument()
})

test('no Save button until a field differs from what the user has', () => {
  setup()
  expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  fireEvent.change(screen.getByDisplayValue('bob'), { target: { value: 'robert' } })
  expect(saveIn('Username')).toBeInTheDocument()
})

test('a username under three characters cannot be saved', () => {
  setup()
  fireEvent.change(screen.getByDisplayValue('bob'), { target: { value: 'bo' } })
  expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
})

test('saving the username sends that one field, trimmed, and reports it', async () => {
  const { onUpdated } = setup()
  fireEvent.change(screen.getByDisplayValue('bob'), { target: { value: '  robert  ' } })
  fireEvent.click(saveIn('Username'))
  await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, 'username', 'robert'))
  expect(sent()).toEqual({ id: 11, field: 'username', value: 'robert' })
  expect(notify.success).toHaveBeenCalledWith('bob: username saved')
})

test('clearing the email sends null, not an empty string', async () => {
  setup()
  fireEvent.change(screen.getByDisplayValue('bob@test.com'), { target: { value: '' } })
  fireEvent.click(saveIn('Email'))
  await waitFor(() => expect(adminFetch).toHaveBeenCalled())
  expect(sent()).toEqual({ id: 11, field: 'email', value: null })
})

test('a refusal is shown beside that field and nothing is reported as saved', async () => {
  ;(adminFetch as jest.Mock).mockImplementation(() => reply({ error: 'Email already in use' }, false))
  const { onUpdated } = setup()
  fireEvent.change(screen.getByDisplayValue('bob@test.com'), { target: { value: 'taken@test.com' } })
  fireEvent.click(saveIn('Email'))
  expect(await within(row('Email')).findByText('Email already in use')).toBeInTheDocument()
  expect(onUpdated).not.toHaveBeenCalled()
  expect(notify.success).not.toHaveBeenCalled()
})

test('a network failure is shown beside the field too', async () => {
  ;(adminFetch as jest.Mock).mockRejectedValue(new Error('offline'))
  setup()
  fireEvent.change(screen.getByDisplayValue('bob'), { target: { value: 'robert' } })
  fireEvent.click(saveIn('Username'))
  expect(await within(row('Username')).findByText('Something went wrong')).toBeInTheDocument()
})

test('the avatar is saved as null when emptied', async () => {
  setup({ ...USER, avatar: 'https://x.test/a.png' } as AdminUser)
  fireEvent.change(screen.getByDisplayValue('https://x.test/a.png'), { target: { value: '' } })
  fireEvent.click(saveIn('Avatar URL'))
  await waitFor(() => expect(adminFetch).toHaveBeenCalled())
  expect(sent()).toEqual({ id: 11, field: 'avatar', value: null })
})

describe('location', () => {
  test('shows the current country, and Not set when there is none', () => {
    setup()
    expect(screen.getByText('Spain')).toBeInTheDocument()
  })

  test('picking a country saves it at once', async () => {
    const { onUpdated } = setup({ ...USER, location: null } as AdminUser)
    expect(screen.getByText('Not set')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Not set'))
    fireEvent.change(screen.getByPlaceholderText('Search country...'), { target: { value: 'france' } })
    fireEvent.click(screen.getByRole('button', { name: /France/ }))
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, 'location', 'FR'))
    expect(sent()).toEqual({ id: 11, field: 'location', value: 'FR' })
  })

  test('the picker filters by name or by code, and can be cancelled', () => {
    setup()
    fireEvent.click(screen.getByText('Spain'))
    fireEvent.change(screen.getByPlaceholderText('Search country...'), { target: { value: 'zzzz' } })
    expect(screen.queryByRole('button', { name: /Spain/ })).not.toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search country...'), { target: { value: 'es' } })
    expect(screen.getByRole('button', { name: /Spain/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByPlaceholderText('Search country...')).not.toBeInTheDocument()
  })

  test('Clear removes it', async () => {
    const { onUpdated } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, 'location', null))
    expect(screen.getByText('Not set')).toBeInTheDocument()
  })
})

describe('admin', () => {
  const toggle = () => screen.getByRole('switch', { name: 'Admin privileges' })

  test('an admin can be made, and it is saved at once', async () => {
    const { onUpdated } = setup()
    expect(toggle()).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle())
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(11, 'admin', true))
    expect(toggle()).toHaveAttribute('aria-checked', 'true')
  })

  test('your own admin cannot be switched off, and the screen says why', () => {
    setup({ ...USER, id: 3, admin: true } as AdminUser, 3)
    expect(toggle()).toBeDisabled()
    expect(screen.getByText(/Can.t remove own admin/)).toBeInTheDocument()
  })
})

test('Close closes', () => {
  const { onClose } = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})

test('a user with no avatar gets their initial instead', () => {
  setup()
  expect(screen.getByText('B')).toBeInTheDocument()
})
