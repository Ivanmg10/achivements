jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserPlatforms from './UserPlatforms'
import { useSession } from 'next-auth/react'
import { useSteamLink } from '@/hooks/useSteamLink'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { en } from '@/translations/en'
import { notify } from '@/lib/notify'

jest.mock('@/hooks/useSteamLink', () => ({
  ...jest.requireActual('@/hooks/useSteamLink'),
  useSteamLink: jest.fn(),
}))
jest.mock('@/utils/apiCallsUtils', () => ({ unlinkRaUser: jest.fn() }))
jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: jest.fn(() => ({ profile: null })) }))
jest.mock('@/hooks/useUserRank', () => ({ useUserRank: () => ({ rank: { Rank: 16520 }, isLoading: false }) }))
jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: () => ({ awards: { MasteryAwardsCount: 12 }, isLoading: false }) }))
jest.mock('@/context/GamesDataContext', () => ({ useGamesData: () => ({ all: [{}, {}], inProgress: [{}], hardcore: [], softcore: [] }) }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: () => ({ library: [], libraryLoading: false }) }))
jest.mock('@/components/user-page/user-psn-card/UserPsnCard', () => ({
  __esModule: true,
  default: () => <section aria-label="PlayStation Network" />,
}))
jest.mock('@/components/ra-login-modal/RaLoginModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="ra-modal" /> : null),
}))

const disconnect = jest.fn()

function setSteam(overrides: Record<string, unknown> = {}) {
  ;(useSteamLink as jest.Mock).mockReturnValue({
    steamId: '765', steamUsername: 'ivan', isLinked: true, status: null, isUnlinking: false, disconnect, ...overrides,
  })
}

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
  setSteam()
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
  expect(screen.getByText('ivan')).toBeInTheDocument()
  expect(screen.getByText('765')).toBeInTheDocument()
})

test('each connected platform shows its headline numbers', () => {
  render(<UserPlatforms />)
  const ra = screen.getByRole('region', { name: 'RetroAchievements' })
  expect(ra).toHaveTextContent(en.userStats.globalRank)
  expect(ra).toHaveTextContent(/4.?200/)
  expect(screen.getByRole('region', { name: 'Steam' })).toHaveTextContent(en.steam.perfect)
  expect(screen.queryByRole('button', { name: en.userPage.viewData })).not.toBeInTheDocument()
})

test('disconnecting: RA unlinks, Steam disconnects', () => {
  render(<UserPlatforms />)
  fireEvent.click(screen.getByRole('button', { name: en.userConfig.signOutRA }))
  expect(unlinkRaUser).toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: en.userData.steamDisconnect }))
  expect(disconnect).toHaveBeenCalled()
})

test('disconnected platforms offer to connect instead', () => {
  setRa(false)
  setSteam({ isLinked: false })
  render(<UserPlatforms />)

  expect(screen.getByRole('link', { name: en.userData.steamConnect }).getAttribute('href')).toContain('/api/steam/link')

  fireEvent.click(screen.getByRole('button', { name: en.userData.signInRA }))
  expect(screen.getByTestId('ra-modal')).toBeInTheDocument()
})

test('a failed Steam link is announced', () => {
  setSteam({ isLinked: false, status: 'failed' })
  render(<UserPlatforms />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.userData.steamFailed)
})

test('the Steam card shows the Steam profile picture and name, as RA does', () => {
  ;(useSteamProfile as jest.Mock).mockReturnValue({
    profile: { personaname: 'Palmera', avatarfull: 'https://avatars.steamstatic.com/abc_full.jpg' },
  })
  const { container } = render(<UserPlatforms />)
  const steam = screen.getByRole('region', { name: 'Steam' })
  expect(steam).toHaveTextContent('Palmera')
  expect(container.querySelector('img[src*="avatars.steamstatic.com"]')).not.toBeNull()
})

test('falls back to the Steam logo until the profile loads', () => {
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: null })
  render(<UserPlatforms />)
  expect(screen.getByRole('region', { name: 'Steam' })).toHaveTextContent('ivan')
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
