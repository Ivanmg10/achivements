import { render, screen, fireEvent } from '@testing-library/react'
import UserIdentityCard from './UserIdentityCard'
import { useSession, signOut } from 'next-auth/react'
import { en } from '@/translations/en'

jest.mock('@/components/change-password-modal/ChangePasswordModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="password-modal" /> : null),
}))
jest.mock('@/components/edit-profile-modal/EditProfileModal', () => ({
  __esModule: true,
  default: ({ field }: { field: string }) => <div data-testid="edit-modal">{field}</div>,
}))

const USER = { id: '3', name: 'ivanxmarine', email: 'a@b.c', location: 'ES', rausername: 'Ivan', avatar: 'https://x/a.png' }

function setUser(user: Record<string, unknown> = USER) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, update: jest.fn() })
}

beforeEach(() => {
  jest.clearAllMocks()
  setUser()
})

test('shows who you are: name, id, country and email', () => {
  render(<UserIdentityCard />)
  expect(screen.getByRole('heading', { name: 'ivanxmarine' })).toBeInTheDocument()
  expect(screen.getByText('ID: 3')).toBeInTheDocument()
  expect(screen.getByText('Spain')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `${en.userData.email}: a@b.c` })).toBeInTheDocument()
})

test('the RetroAchievements rank belongs to its platform card, not here', () => {
  render(<UserIdentityCard />)
  expect(screen.queryByText(en.userStats.globalRank)).not.toBeInTheDocument()
})

test('the admin badge is only for admins', () => {
  render(<UserIdentityCard />)
  expect(screen.queryByText(en.userData.admin)).not.toBeInTheDocument()
  setUser({ ...USER, admin: true })
  render(<UserIdentityCard />)
  expect(screen.getByText(en.userData.admin)).toBeInTheDocument()
})

test('avatar, name and email each open the edit modal for their own field', () => {
  render(<UserIdentityCard />)
  fireEvent.click(screen.getByRole('button', { name: en.userPage.editAvatar }))
  expect(screen.getByTestId('edit-modal')).toHaveTextContent('avatar')
})

test('change password opens its modal, sign out signs out', () => {
  render(<UserIdentityCard />)
  fireEvent.click(screen.getByRole('button', { name: en.userData.changePassword }))
  expect(screen.getByTestId('password-modal')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: en.userConfig.signOut }))
  expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/authPage' })
})
