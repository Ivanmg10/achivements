import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminPanel from './AdminPanel'
import { useSession } from 'next-auth/react'

jest.mock('./AdminCreateUserModal', () => ({ __esModule: true, default: () => null }))
jest.mock('./AdminEditUserModal', () => ({ __esModule: true, default: () => null }))
jest.mock('./admin-user-card/AdminUserCard', () => ({
  __esModule: true,
  default: ({ user }: { user: { username: string } }) => <li>{user.username}</li>,
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
