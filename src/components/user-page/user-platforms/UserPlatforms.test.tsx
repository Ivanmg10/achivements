jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserPlatforms from './UserPlatforms'
import { useSession } from 'next-auth/react'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { en } from '@/translations/en'
import { notify } from '@/lib/notify'

jest.mock('@/utils/apiCallsUtils', () => ({ unlinkRaUser: jest.fn() }))
jest.mock('@/hooks/useUserRank', () => ({ useUserRank: () => ({ rank: { Rank: 16520 }, isLoading: false }) }))
jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: () => ({ awards: { MasteryAwardsCount: 12 }, isLoading: false }) }))
jest.mock('@/context/GamesDataContext', () => ({ useGamesData: () => ({ all: [{}, {}], inProgress: [{}], hardcore: [], softcore: [] }) }))
jest.mock('@/components/user-page/user-steam-card/UserSteamCard', () => ({
  __esModule: true,
  default: () => <section aria-label="Steam" />,
}))
jest.mock('@/components/user-page/user-psn-card/UserPsnCard', () => ({
  __esModule: true,
  default: () => <section aria-label="PlayStation Network" />,
}))
jest.mock('@/components/ra-login-modal/RaLoginModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="ra-modal" /> : null),
}))

function setRa(connected: boolean) {
  ;(useSession as jest.Mock).mockReturnValue({
    data: connected
      ? { user: { rausername: 'Ivan', raUser: { User: 'Ivan', ULID: 'ABC', TotalPoints: 4200, UserPic: '/p.png' } } }
      : { user: {} },
    update: jest.fn(),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  setRa(true)
})

test('one card per platform', () => {
  render(<UserPlatforms />)
  expect(screen.getByRole('region', { name: 'RetroAchievements' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Steam' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'PlayStation Network' })).toBeInTheDocument()
})

test('a connected platform shows the account it is connected as', () => {
  render(<UserPlatforms />)
  expect(screen.getByText('Ivan')).toBeInTheDocument()
  expect(screen.getByText('ABC')).toBeInTheDocument()
})

test('each connected platform shows its headline numbers', () => {
  render(<UserPlatforms />)
  const ra = screen.getByRole('region', { name: 'RetroAchievements' })
  expect(ra).toHaveTextContent(en.userStats.globalRank)
  expect(ra).toHaveTextContent(/4.?200/)
  expect(screen.queryByRole('button', { name: en.userPage.viewData })).not.toBeInTheDocument()
})

test('disconnecting RA unlinks it', () => {
  render(<UserPlatforms />)
  fireEvent.click(screen.getByRole('button', { name: en.userConfig.signOutRA }))
  expect(unlinkRaUser).toHaveBeenCalled()
})

test('RA disconnected offers to connect instead', () => {
  setRa(false)
  render(<UserPlatforms />)

  fireEvent.click(screen.getByRole('button', { name: en.userData.signInRA }))
  expect(screen.getByTestId('ra-modal')).toBeInTheDocument()
})

test('unlinking RA says whether it worked', async () => {
  ;(unlinkRaUser as jest.Mock).mockResolvedValueOnce(true)
  render(<UserPlatforms />)
  fireEvent.click(screen.getByRole('button', { name: en.userConfig.signOutRA }))
  await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.raUnlinked))

  ;(unlinkRaUser as jest.Mock).mockResolvedValueOnce(false)
  fireEvent.click(screen.getByRole('button', { name: en.userConfig.signOutRA }))
  await waitFor(() => expect(notify.error).toHaveBeenCalledWith(en.toast.unlinkFailed))
})
