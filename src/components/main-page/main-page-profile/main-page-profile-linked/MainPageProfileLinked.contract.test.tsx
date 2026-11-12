jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/hooks/useSteamRecentAchievements', () => ({ useSteamRecentAchievements: jest.fn() }))
jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/hooks/usePsnRecentTrophies', () => ({ usePsnRecentTrophies: jest.fn() }))
jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/hooks/useXboxRecentAchievements', () => ({ useXboxRecentAchievements: jest.fn() }))
jest.mock('../main-page-profile-st/main-page-profile-st-game/MainPageProfileStGame', () => ({ __esModule: true, default: () => <div data-testid="game" /> }))
jest.mock('../main-page-profile-psn/main-page-profile-psn-game/MainPageProfilePsnGame', () => ({ __esModule: true, default: () => <div data-testid="game" /> }))
jest.mock('../main-page-profile-xbox/main-page-profile-xbox-game/MainPageProfileXboxGame', () => ({ __esModule: true, default: () => <div data-testid="game" /> }))
jest.mock('../main-page-profile-st/main-page-profile-st-achievements/MainPageProfileStAchievements', () => ({ __esModule: true, default: () => <div data-testid="recent" /> }))
jest.mock('../main-page-profile-psn/main-page-profile-psn-trophies/MainPageProfilePsnTrophies', () => ({ __esModule: true, default: () => <div data-testid="recent" /> }))
jest.mock('../main-page-profile-xbox/main-page-profile-xbox-achievements/MainPageProfileXboxAchievements', () => ({ __esModule: true, default: () => <div data-testid="recent" /> }))

import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import MainPageProfileStLinked from '../main-page-profile-st/main-page-profile-st-linked/MainPageProfileStLinked'
import MainPageProfilePsnLinked from '../main-page-profile-psn/main-page-profile-psn-linked/MainPageProfilePsnLinked'
import MainPageProfileXboxLinked from '../main-page-profile-xbox/main-page-profile-xbox-linked/MainPageProfileXboxLinked'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxRecentAchievements } from '@/hooks/useXboxRecentAchievements'
import { SubjectContext } from '@/context/SubjectContext'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { en } from '@/translations/en'

type Spies = { onRetry: jest.Mock; recentRetry: jest.Mock; refetch: jest.Mock }
type Platform = {
  name: string
  retryLabel: string
  failureTitle: string
  linkLabel: string
  /** Sets up the platform's hooks: a game in the library or none, loading or not. */
  setup: (s: Spies, opts: { game: boolean; libraryLoading: boolean }) => void
  /** The adapter, with a readable account (`ok`) or none. */
  row: (s: Spies, ok: boolean, isLoading?: boolean) => ReactElement
}

const PLATFORMS: Platform[] = [
  {
    name: 'Steam',
    retryLabel: en.steam.retry,
    failureTitle: en.steam.profileError,
    linkLabel: en.steam.viewOnSteam,
    setup: (s, o) => {
      ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: [], libraryLoading: o.libraryLoading, recent: o.game ? [{ id: 1, title: 'Portal' }] : [], refetch: s.refetch })
      ;(useSteamRecentAchievements as jest.Mock).mockReturnValue({ achievements: [], isLoading: false, error: null, retry: s.recentRetry })
    },
    row: (s, ok, isLoading = false) => (
      <MainPageProfileStLinked profile={ok ? { steamid: '1', personaname: 'Palmera', profileurl: 'https://steamcommunity.com/id/p/', level: 1 } : null} isLoading={isLoading} error={ok ? null : 'failed'} onRetry={s.onRetry} />
    ),
  },
  {
    name: 'PlayStation',
    retryLabel: en.psn.retry,
    failureTitle: en.psn.profileError,
    linkLabel: en.psn.viewOnPsn,
    setup: (s, o) => {
      ;(usePsnGamesData as jest.Mock).mockReturnValue({ library: o.game ? [{ id: 1, title: 'Astro Bot', playedAs: [] }] : [], libraryLoading: o.libraryLoading, fullLibrary: [], refetch: s.refetch })
      ;(usePsnRecentTrophies as jest.Mock).mockReturnValue({ trophies: [], isLoading: false, error: null, retry: s.recentRetry })
    },
    row: (s, ok, isLoading = false) => (
      <MainPageProfilePsnLinked
        summary={ok ? { onlineId: 'Palmera', avatarUrl: '', aboutMe: '', isPlus: false, trophyLevel: 1, tier: 1, levelProgress: 0, earned: { bronze: 0, silver: 0, gold: 0, platinum: 0 }, games: 0 } : null}
        isLoading={isLoading}
        error={ok ? null : 'failed'}
        onRetry={s.onRetry}
      />
    ),
  },
  {
    name: 'Xbox',
    retryLabel: en.xbox.retry,
    failureTitle: en.xbox.profileError,
    linkLabel: en.xbox.viewOnXbox,
    setup: (s, o) => {
      ;(useXboxGamesData as jest.Mock).mockReturnValue({ library: o.game ? [xboxGameFixture({ title: 'Halo' })] : [], libraryLoading: o.libraryLoading, fullLibrary: [], refetch: s.refetch })
      ;(useXboxRecentAchievements as jest.Mock).mockReturnValue({ achievements: [], isLoading: false, error: null, retry: s.recentRetry })
    },
    row: (s, ok, isLoading = false) => (
      <MainPageProfileXboxLinked
        summary={ok ? { gamertag: 'Palmera', avatarUrl: null, bio: '', tier: 'Gold', gamerscore: 1, achievementsUnlocked: 1, games: 1 } : null}
        isLoading={isLoading}
        error={ok ? null : 'failed'}
        onRetry={s.onRetry}
      />
    ),
  },
]

describe.each(PLATFORMS)('a linked profile on the home: $name', (p) => {
  const spies = (): Spies => ({ onRetry: jest.fn(), recentRetry: jest.fn(), refetch: jest.fn() })
  // The console filter reads the PSN and Xbox libraries whatever platform is shown.
  beforeEach(() => {
    ;(usePsnGamesData as jest.Mock).mockReturnValue({ fullLibrary: [], library: [] })
    ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [], library: [] })
  })

  test('holds its place with a skeleton while the account loads', () => {
    const s = spies()
    p.setup(s, { game: true, libraryLoading: false })
    const { container } = render(p.row(s, true, true))
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(screen.queryByText('Palmera')).not.toBeInTheDocument()
  })

  test('says it could not be read, and asks again', () => {
    const s = spies()
    p.setup(s, { game: false, libraryLoading: false })
    render(p.row(s, false))
    expect(screen.getByRole('alert')).toHaveTextContent(p.failureTitle)
    fireEvent.click(screen.getByRole('button', { name: p.retryLabel }))
    expect(s.onRetry).toHaveBeenCalledTimes(1)
  })

  test('shows the account, its last game and its latest unlocks, with the link out', () => {
    const s = spies()
    p.setup(s, { game: true, libraryLoading: false })
    render(p.row(s, true))
    expect(screen.getByText('Palmera')).toBeInTheDocument()
    expect(screen.getByTestId('game')).toBeInTheDocument()
    expect(screen.getByTestId('recent')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: p.linkLabel })).toBeInTheDocument()
  })

  test('keeps the last game\'s room with a skeleton while the library loads', () => {
    const s = spies()
    p.setup(s, { game: false, libraryLoading: true })
    const { container } = render(p.row(s, true))
    expect(screen.queryByTestId('game')).not.toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  test('refresh asks the account, the latest unlocks and the library again, on the own page only', () => {
    const s = spies()
    p.setup(s, { game: true, libraryLoading: false })
    const { unmount } = render(p.row(s, true))
    fireEvent.click(screen.getByRole('button', { name: en.profileRa.refreshData }))
    expect([s.onRetry, s.recentRetry, s.refetch].map((f) => f.mock.calls.length)).toEqual([1, 1, 1])
    unmount()
    render(<SubjectContext.Provider value="someone">{p.row(s, true)}</SubjectContext.Provider>)
    expect(screen.queryByRole('button', { name: en.profileRa.refreshData })).not.toBeInTheDocument()
  })

  test('on someone\'s page the latest unlocks are not drawn: their page lists them itself (#130)', () => {
    const s = spies()
    p.setup(s, { game: true, libraryLoading: false })
    render(<SubjectContext.Provider value="someone">{p.row(s, true)}</SubjectContext.Provider>)
    expect(screen.queryByTestId('recent')).not.toBeInTheDocument()
  })
})
