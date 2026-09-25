import { render, screen, fireEvent } from '@testing-library/react'
import AdminUserCard from './AdminUserCard'
import type { AdminUser } from '@/types/user'

jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

const USER: AdminUser = {
  id: 11, username: 'papucarrot', email: 'papu@test.com', theme: 'dark', avatar: null, admin: false,
  rausername: 'Papu', ra_display: 'PapuRA', location: 'ES', steamusername: null,
}

test('shows the user, their country and the accounts they linked', () => {
  render(<AdminUserCard user={USER} isSelf={false} onEdit={jest.fn()} onToggleAdmin={jest.fn()} onDelete={jest.fn()} />)
  expect(screen.getByText('papucarrot')).toBeInTheDocument()
  expect(screen.getByText('#11')).toBeInTheDocument()
  expect(screen.getByText('papu@test.com')).toBeInTheDocument()
  expect(screen.getByText('PapuRA')).toBeInTheDocument()
  // Steam is not linked: a dash rather than a blank
  expect(screen.getByText('—')).toBeInTheDocument()
})

test('grants and revokes admin', () => {
  const onToggleAdmin = jest.fn()
  const { rerender } = render(
    <AdminUserCard user={USER} isSelf={false} onEdit={jest.fn()} onToggleAdmin={onToggleAdmin} onDelete={jest.fn()} />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Make papucarrot admin' }))
  expect(onToggleAdmin).toHaveBeenCalled()

  rerender(
    <AdminUserCard user={{ ...USER, admin: true }} isSelf={false} onEdit={jest.fn()} onToggleAdmin={onToggleAdmin} onDelete={jest.fn()} />,
  )
  expect(screen.getByRole('button', { name: 'Remove admin from papucarrot' })).toBeInTheDocument()
})

test('an admin cannot change their own role', () => {
  render(<AdminUserCard user={{ ...USER, admin: true }} isSelf onEdit={jest.fn()} onToggleAdmin={jest.fn()} onDelete={jest.fn()} />)
  expect(screen.getByRole('button', { name: 'Remove admin from papucarrot' })).toBeDisabled()
  expect(screen.getByText('(you)')).toBeInTheDocument()
})

test('edit opens the editor', () => {
  const onEdit = jest.fn()
  render(<AdminUserCard user={USER} isSelf={false} onEdit={onEdit} onToggleAdmin={jest.fn()} onDelete={jest.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Edit papucarrot' }))
  expect(onEdit).toHaveBeenCalled()
})

test('deletes, except your own account', () => {
  const onDelete = jest.fn()
  const { rerender } = render(
    <AdminUserCard user={USER} isSelf={false} onEdit={jest.fn()} onToggleAdmin={jest.fn()} onDelete={onDelete} />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Delete papucarrot' }))
  expect(onDelete).toHaveBeenCalled()

  rerender(<AdminUserCard user={USER} isSelf onEdit={jest.fn()} onToggleAdmin={jest.fn()} onDelete={onDelete} />)
  expect(screen.getByRole('button', { name: 'Delete papucarrot' })).toBeDisabled()
})
