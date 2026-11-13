import { render, screen, fireEvent, within } from '@testing-library/react'
import AdminUserRow from './AdminUserRow'
import type { AdminUser } from '@/types/user'

jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

const USER: AdminUser = {
  id: 11, username: 'papucarrot', email: 'papu@test.com', theme: 'dark', avatar: null, admin: false,
  rausername: 'Papu', ra_display: 'PapuRA', location: 'ES', steamusername: null,
}

const noop = jest.fn()
const row = (user: AdminUser, isSelf = false, handlers: Partial<Record<'onEdit' | 'onToggleAdmin' | 'onDelete', () => void>> = {}) =>
  render(
    <table>
      <tbody>
        <AdminUserRow user={user} isSelf={isSelf} onEdit={noop} onToggleAdmin={noop} onDelete={noop} {...handlers} />
      </tbody>
    </table>,
  )

test('shows the user, their id and email, and the accounts they linked as logos', () => {
  row(USER)
  expect(screen.getByText('papucarrot')).toBeInTheDocument()
  expect(screen.getByText('#11')).toBeInTheDocument()
  expect(screen.getAllByText('papu@test.com').length).toBeGreaterThan(0)
  expect(screen.getByRole('img', { name: 'RetroAchievements: PapuRA' })).toBeInTheDocument()
  // Only what is linked is drawn.
  expect(screen.queryByRole('img', { name: /Steam|PSN|Xbox/ })).not.toBeInTheDocument()
})

test('no linked account is a dash, not a blank', () => {
  row({ ...USER, rausername: null, ra_display: null })
  const cells = within(screen.getByRole('row')).getAllByRole('cell')
  expect(cells.some((c) => c.textContent === '—')).toBe(true)
})

test.each([
  ['Steam', { steamid: '765', steamusername: 'PapuSteam' }, 'Steam: PapuSteam'],
  ['PSN', { psnaccountid: '42', psnusername: 'PapuPS' }, 'PSN: PapuPS'],
  ['Xbox', { xboxxuid: '2535', xboxgamertag: 'PapuBox' }, 'Xbox: PapuBox'],
])('shows the %s account once linked', (_, linked, label) => {
  row({ ...USER, ...linked })
  expect(screen.getByRole('img', { name: label })).toBeInTheDocument()
})

test('an account linked with no name names its id, as the linked accounts block does', () => {
  row({ ...USER, steamid: '76561198000000000' })
  expect(screen.getByRole('img', { name: 'Steam: 76561198000000000' })).toBeInTheDocument()
})

test('an admin wears the tag; grants and revokes admin', () => {
  const onToggleAdmin = jest.fn()
  const { unmount } = row(USER, false, { onToggleAdmin })
  expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Make papucarrot admin' }))
  expect(onToggleAdmin).toHaveBeenCalled()
  unmount()

  row({ ...USER, admin: true })
  expect(screen.getByText('Admin')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Remove admin from papucarrot' })).toBeInTheDocument()
})

test('an admin cannot change their own role or delete their own account', () => {
  row({ ...USER, admin: true }, true)
  expect(screen.getByRole('button', { name: 'Remove admin from papucarrot' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Delete papucarrot' })).toBeDisabled()
  expect(screen.getByText('(you)')).toBeInTheDocument()
})

test('edit and delete call back', () => {
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  row(USER, false, { onEdit, onDelete })
  fireEvent.click(screen.getByRole('button', { name: 'Edit papucarrot' }))
  fireEvent.click(screen.getByRole('button', { name: 'Delete papucarrot' }))
  expect(onEdit).toHaveBeenCalled()
  expect(onDelete).toHaveBeenCalled()
})
