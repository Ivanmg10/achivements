import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminPanel from './AdminPanel'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'

jest.mock('./AdminCreateUserModal', () => ({ __esModule: true, default: () => null }))
jest.mock('./AdminEditUserModal', () => ({ __esModule: true, default: () => null }))
jest.mock('./admin-user-card/AdminUserCard', () => ({
  __esModule: true,
  default: ({ user, onDelete }: { user: { username: string }; onDelete: () => void }) => (
    <li>
      {user.username}
      <button onClick={onDelete}>delete {user.username}</button>
    </li>
  ),
}))

const USERS = [
  { id: 3, username: 'ivanxmarine', email: 'hi@test.com', admin: true, rausername: 'PalmeraMiami', steamusername: 'Palmera' },
  { id: 11, username: 'papucarrot', email: 'papu@test.com', admin: false, rausername: null, steamusername: null },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { id: '3' } } })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(USERS) })
})

test('lists every user once loaded', async () => {
  render(<AdminPanel />)
  expect(await screen.findByText('ivanxmarine')).toBeInTheDocument()
  expect(screen.getByText('papucarrot')).toBeInTheDocument()
})

test('the search box filters by name, email, id or linked account', async () => {
  render(<AdminPanel />)
  await screen.findByText('ivanxmarine')
  const search = screen.getByRole('textbox', { name: 'Search users' })

  fireEvent.change(search, { target: { value: 'papu@test' } })
  expect(screen.queryByText('ivanxmarine')).not.toBeInTheDocument()
  expect(screen.getByText('papucarrot')).toBeInTheDocument()

  fireEvent.change(search, { target: { value: 'palmera' } })
  expect(screen.getByText('ivanxmarine')).toBeInTheDocument()

  fireEvent.change(search, { target: { value: '11' } })
  expect(screen.getByText('papucarrot')).toBeInTheDocument()
})

test('says so when nothing matches', async () => {
  render(<AdminPanel />)
  await screen.findByText('ivanxmarine')
  fireEvent.change(screen.getByRole('textbox', { name: 'Search users' }), { target: { value: 'zzz' } })
  expect(screen.getByText('No users match that search')).toBeInTheDocument()
})

test('reports a failed load', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
  render(<AdminPanel />)
  await waitFor(() => expect(screen.getByText('Failed to load users')).toBeInTheDocument())
})

describe('deleting a user', () => {
  async function openConfirm() {
    render(<AdminPanel />)
    await screen.findByText('papucarrot')
    fireEvent.click(screen.getByRole('button', { name: 'delete papucarrot' }))
  }

  test('asks first, then removes the user from the list', async () => {
    await openConfirm()
    expect(screen.getByText(/Delete papucarrot and everything they own/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete user' }))
    await waitFor(() => expect(screen.queryByText('papucarrot')).not.toBeInTheDocument())
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users?id=11', { method: 'DELETE' })
    expect(screen.getByText('ivanxmarine')).toBeInTheDocument()
  })

  test('cancelling keeps the user', async () => {
    await openConfirm()
    fireEvent.click(screen.getByRole('button', { name: en.groups.cancel }))
    expect(screen.getByText('papucarrot')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('a refused delete says why and keeps the user', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string, init?: { method?: string }) =>
      init?.method === 'DELETE'
        ? Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Cannot delete your own account' }) })
        : Promise.resolve({ ok: true, json: () => Promise.resolve(USERS) }),
    )
    await openConfirm()
    fireEvent.click(screen.getByRole('button', { name: 'Delete user' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot delete your own account')
    expect(screen.getByText('papucarrot')).toBeInTheDocument()
  })
})
