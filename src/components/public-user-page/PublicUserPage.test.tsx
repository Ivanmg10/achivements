import { render, screen, fireEvent } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import PublicUserPage from './PublicUserPage'
import { useCheevoUser } from '@/hooks/useCheevoUser'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { useStreakData } from '@/hooks/useStreakData'
import { en } from '@/translations/en'

jest.mock('@/hooks/useCheevoUser', () => ({ useCheevoUser: jest.fn() }))
jest.mock('@/hooks/useProfileLibrary', () => ({ useProfileLibrary: jest.fn() }))
jest.mock('@/hooks/useStreakData', () => ({ useStreakData: jest.fn() }))
jest.mock('@/components/subject-providers/SubjectProviders', () => ({
  __esModule: true,
  default: ({ user, children }: { user: { username: string }; children: React.ReactNode }) => (
    <div data-testid="subject" data-user={user.username}>{children}</div>
  ),
}))
jest.mock('./public-user-body/PublicUserBody', () => ({
  __esModule: true,
  default: ({ viewer }: { viewer: { name: string; games: unknown[]; isLoading: boolean } }) => (
    <div data-testid="body" data-viewer={viewer.name} data-games={viewer.games.length} data-loading={String(viewer.isLoading)} />
  ),
}))
jest.mock('./public-user-hero/PublicUserHero', () => ({ __esModule: true, default: () => <div data-testid="hero" /> }))

const USER = { username: 'ivan', avatar: null, description: null, location: null, ra: 'IvanRA' as string | null, steam: true, psn: false }
const retry = jest.fn()

function setup({ user = USER as typeof USER | null, error = null as string | null, isLoading = false } = {}) {
  ;(useCheevoUser as jest.Mock).mockReturnValue({ user, isLoading, error, retry })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'me', avatar: null } }, status: 'authenticated' })
  ;(useProfileLibrary as jest.Mock).mockReturnValue({ games: [{ key: 'ra:1' }], isLoading: false })
  ;(useStreakData as jest.Mock).mockReturnValue({ achievements: [], activeStreak: null, bestStreak: null, isLoading: true })
})

test("reads the page as them, with your own numbers beside it for the comparison", () => {
  setup()
  render(<PublicUserPage username="ivan" />)
  expect(screen.getByTestId('subject')).toHaveAttribute('data-user', 'ivan')
  const body = screen.getByTestId('body')
  expect(body).toHaveAttribute('data-viewer', 'me')
  expect(body).toHaveAttribute('data-games', '1')
  expect(body).toHaveAttribute('data-loading', 'true')
})

test('a user with nothing linked gets their hero and a note', () => {
  setup({ user: { ...USER, ra: null, steam: false } })
  render(<PublicUserPage username="ivan" />)
  expect(screen.getByTestId('hero')).toBeInTheDocument()
  expect(screen.getByText(en.publicProfile.noAccounts)).toBeInTheDocument()
  expect(screen.queryByTestId('body')).not.toBeInTheDocument()
})

test('an unknown user says so', () => {
  setup({ user: null, error: 'missing' })
  render(<PublicUserPage username="nobody" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.publicProfile.userNotFound.replace('{u}', 'nobody'))
})

test('a failure offers a retry', () => {
  setup({ user: null, error: 'failed' })
  render(<PublicUserPage username="ivan" />)
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
  expect(retry).toHaveBeenCalled()
})

test('shows its skeleton while the user loads', () => {
  setup({ user: null, isLoading: true })
  render(<PublicUserPage username="ivan" />)
  expect(screen.getByRole('status')).toHaveTextContent(en.userProfile.loadingProfile)
})
