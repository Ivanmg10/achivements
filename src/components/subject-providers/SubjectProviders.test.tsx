import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { SessionContext } from 'next-auth/react'
import SubjectProviders from './SubjectProviders'
import { useSubject } from '@/context/SubjectContext'
import { usePublicUserProfile } from '@/hooks/usePublicUserProfile'

jest.mock('@/hooks/usePublicUserProfile', () => ({ usePublicUserProfile: jest.fn() }))
// The providers fetch on their own; what matters here is the session and subject they sit under.
jest.mock('@/context/RecentAchievementsContext', () => ({ RecentAchievementsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
jest.mock('@/context/RecentlyPlayedGamesContext', () => ({ RecentlyPlayedGamesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
jest.mock('@/context/ActivityHeatmapYearContext', () => ({ ActivityHeatmapYearProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
jest.mock('@/context/GamesDataContext', () => ({ GamesDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
jest.mock('@/context/SteamGamesDataContext', () => ({ SteamGamesDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
jest.mock('@/context/PsnGamesDataContext', () => ({ PsnGamesDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
jest.mock('@/context/MainPlatformContext', () => ({ MainPlatformProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))

const USER = { username: 'bob', avatar: null, description: null, location: 'ES', ra: 'BobRA', steam: true, psn: false }
const RA_PROFILE = { User: 'BobRA', TotalPoints: 10 }

/** What a child below the providers sees. */
function Probe() {
  const subject = useSubject()
  const session = useContext(SessionContext)
  return <pre data-testid="probe">{JSON.stringify({ subject, status: session?.status, user: session?.data?.user })}</pre>
}
const seen = () => JSON.parse(screen.getByTestId('probe').textContent ?? '{}')

beforeEach(() => {
  jest.clearAllMocks()
  ;(usePublicUserProfile as jest.Mock).mockReturnValue({ profile: RA_PROFILE })
})

test('below it the session is that user, and reads name them', () => {
  render(<SubjectProviders user={USER}><Probe /></SubjectProviders>)
  const { subject, status, user } = seen()
  expect(subject).toBe('bob')
  expect(status).toBe('authenticated')
  expect(user).toMatchObject({ name: 'bob', rausername: 'BobRA', raLinked: true, raUser: RA_PROFILE, location: 'ES' })
  expect(user.steamid).toBeTruthy()
  expect(user.psnaccountid).toBeUndefined()
})

test('a user with no RA is not looked up on RA', () => {
  render(<SubjectProviders user={{ ...USER, ra: null }}><Probe /></SubjectProviders>)
  expect(seen().user.raLinked).toBe(false)
  expect(usePublicUserProfile).toHaveBeenCalledWith('')
})

test('RA is read by the user\'s name, whatever the viewer has linked', () => {
  render(<SubjectProviders user={USER}><Probe /></SubjectProviders>)
  expect(usePublicUserProfile).toHaveBeenCalledWith('bob')
})
