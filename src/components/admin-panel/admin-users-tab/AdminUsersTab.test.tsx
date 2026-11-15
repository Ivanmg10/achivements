import { fireEvent, render, screen, within } from '@testing-library/react'
import AdminUsersTab, { RECENT_USERS } from './AdminUsersTab'
import type { AdminUser } from '@/types/user'

jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

const user = (id: number, extra: Partial<AdminUser> = {}): AdminUser => ({
  id, username: `user${id}`, email: `mail${id}@test.com`, theme: 'dark', avatar: null, admin: false, rausername: null, ra_display: null, location: null, ...extra,
})
// Listed by id ascending, as the route does; the 25th is the newest.
const USERS = Array.from({ length: 25 }, (_, i) => user(i + 1, i === 0 ? { steamusername: 'Palmera', steamid: '1' } : {}))

type Props = React.ComponentProps<typeof AdminUsersTab>
const base: Props = {
  users: USERS, loading: false, error: null, currentAdminId: 1,
  onRetry: jest.fn(), onCreate: jest.fn(), onEdit: jest.fn(), onToggleAdmin: jest.fn(), onDelete: jest.fn(),
}
const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

test('with no search, the 10 most recent sign-ups, newest first, and a way to see all', () => {
  render(<AdminUsersTab {...base} />)
  expect(rows()).toHaveLength(RECENT_USERS)
  expect(rows()[0]).toHaveTextContent('user25')
  expect(rows()[RECENT_USERS - 1]).toHaveTextContent('user16')
  fireEvent.click(screen.getByRole('button', { name: 'See all (25)' }))
  expect(rows()).toHaveLength(25)
  fireEvent.click(screen.getByRole('button', { name: `Show the ${RECENT_USERS} most recent` }))
  expect(rows()).toHaveLength(RECENT_USERS)
})

test('a search shows every match, even past the first 10, and drops "See all"', () => {
  render(<AdminUsersTab {...base} />)
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search users' }), { target: { value: 'user1' } })
  // user1, user10..user19
  expect(rows()).toHaveLength(11)
  expect(screen.queryByRole('button', { name: /See all/ })).not.toBeInTheDocument()
})

test('a search reaches a linked account too', () => {
  render(<AdminUsersTab {...base} />)
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search users' }), { target: { value: 'palmera' } })
  expect(rows()).toHaveLength(1)
  expect(rows()[0]).toHaveTextContent('user1')
})

test('few users: no See all', () => {
  render(<AdminUsersTab {...base} users={USERS.slice(0, 4)} />)
  expect(rows()).toHaveLength(4)
  expect(screen.queryByRole('button', { name: /See all/ })).not.toBeInTheDocument()
})

test('says so when nothing matches', () => {
  render(<AdminUsersTab {...base} />)
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search users' }), { target: { value: 'zzz' } })
  expect(screen.getByText('No users match that search')).toBeInTheDocument()
})

test('New user asks to create one', () => {
  const onCreate = jest.fn()
  render(<AdminUsersTab {...base} onCreate={onCreate} />)
  fireEvent.click(screen.getByRole('button', { name: 'New user' }))
  expect(onCreate).toHaveBeenCalled()
})

test('a failed load has a retry', () => {
  const onRetry = jest.fn()
  render(<AdminUsersTab {...base} users={[]} error="Failed to load users" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Failed to load users')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(onRetry).toHaveBeenCalled()
})

test('loading is the table skeleton, with the toolbar already in place', () => {
  render(<AdminUsersTab {...base} users={[]} loading />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading users')
  expect(screen.getByRole('searchbox', { name: 'Search users' })).toBeInTheDocument()
})
