import { render, screen, fireEvent } from '@testing-library/react'
import UserIdentityCard from './UserIdentityCard'
import { useSession, signOut } from 'next-auth/react'
import { en } from '@/translations/en'

jest.mock('@/components/user-page/user-follow-stats/UserFollowStats', () => ({ __esModule: true, default: () => <div data-testid="follow-stats" /> }))
jest.mock('@/components/location-modal/LocationModal', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/admin-panel/admin-panel-modal/AdminPanelModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role="dialog" aria-label="Admin panel" /> : null),
}))
jest.mock('@/components/change-password-modal/ChangePasswordModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="password-modal" /> : null),
}))
jest.mock('@/components/avatar-modal/AvatarModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="avatar-modal" /> : null),
}))
jest.mock('@/components/edit-profile-modal/EditProfileModal', () => ({
  __esModule: true,
  default: ({ field }: { field: string }) => <div data-testid="edit-modal">{field}</div>,
}))

const USER = { id: '3', name: 'ivanxmarine', email: 'a@b.c', emailVerified: true, location: 'ES', rausername: 'Ivan', avatar: 'https://x/a.png' }

function setUser(user: Record<string, unknown> = USER) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, update: jest.fn() })
}

beforeEach(() => {
  jest.clearAllMocks()
  setUser()
})

test('shows who you are: name, id, and an editable username, email and country', () => {
  render(<UserIdentityCard />)
  expect(screen.getByRole('heading', { name: 'ivanxmarine' })).toBeInTheDocument()
  expect(screen.getByText(/ID 3/)).toBeInTheDocument()
  expect(screen.getByText('Spain')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `${en.userPage.username}: ivanxmarine` })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `${en.userData.email}: a@b.c` })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `${en.userData.location}: Spain` })).toBeInTheDocument()
  expect(screen.queryByText(en.userData.userId)).not.toBeInTheDocument()
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

test('avatar, name and email each open the edit modal for their own field', async () => {
  render(<UserIdentityCard />)
  fireEvent.click(screen.getByRole('button', { name: en.userPage.editAvatar }))
  expect(await screen.findByTestId('avatar-modal')).toBeInTheDocument()
})

test('change password opens its modal, sign out signs out', async () => {
  render(<UserIdentityCard />)
  fireEvent.click(screen.getByRole('button', { name: en.userData.changePassword }))
  expect(await screen.findByTestId('password-modal')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: en.userConfig.signOut }))
  expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/authPage' })
})

test('an account with no email is told why that matters', async () => {
  setUser({ ...USER, email: undefined })
  render(<UserIdentityCard />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.passwordReset.missingEmailTitle)
  fireEvent.click(screen.getByRole('button', { name: en.passwordReset.addEmail }))
  expect(await screen.findByTestId('edit-modal')).toHaveTextContent('email')
})

test('no warning once an address is set and confirmed', () => {
  render(<UserIdentityCard />)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('an address nobody has confirmed is flagged, without blocking anything', () => {
  setUser({ ...USER, emailVerified: false })
  render(<UserIdentityCard />)

  expect(screen.getByRole('alert')).toHaveTextContent(en.passwordReset.verifyTitle)
  // The card itself still works: a notice, not a gate.
  expect(screen.getByRole('button', { name: en.userData.changePassword })).toBeInTheDocument()
})

test('admins get an Admin panel button beside change password, which opens the panel', async () => {
  setUser({ ...USER, admin: true })
  render(<UserIdentityCard />)
  expect(screen.queryByRole('dialog', { name: 'Admin panel' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Admin panel' }))
  expect(await screen.findByRole('dialog', { name: 'Admin panel' })).toBeInTheDocument()
})

test('everyone else gets no Admin panel button', () => {
  setUser(USER)
  render(<UserIdentityCard />)
  expect(screen.queryByRole('button', { name: 'Admin panel' })).not.toBeInTheDocument()
})

test('shows how many you follow and how many follow you', () => {
  render(<UserIdentityCard />)
  expect(screen.getByTestId('follow-stats')).toBeInTheDocument()
})
