import { render, screen, fireEvent } from '@testing-library/react'
import UserIdentityCard from './UserIdentityCard'
import { useSession, signOut } from 'next-auth/react'
import { useUserRank } from '@/hooks/useUserRank'
import { en } from '@/translations/en'

jest.mock('@/hooks/useUserRank', () => ({ useUserRank: jest.fn() }))
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
  ;(useUserRank as jest.Mock).mockReturnValue({ rank: { Rank: 1234 }, isLoading: false })
  setUser()
})

test('shows who you are: name, id, country, email and RA rank', () => {
  render(<UserIdentityCard />)
  expect(screen.getByRole('heading', { name: 'ivanxmarine' })).toBeInTheDocument()
  expect(screen.getByText('ID: 3')).toBeInTheDocument()
  expect(screen.getByText('Spain')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `${en.userData.email}: a@b.c` })).toBeInTheDocument()
  expect(screen.getByText(/^#1.?234$/)).toBeInTheDocument()
})

test('no rank without RetroAchievements', () => {
  setUser({ ...USER, rausername: undefined })
  render(<UserIdentityCard />)
  expect(screen.queryByText(/^#1.?234$/)).not.toBeInTheDocument()
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
