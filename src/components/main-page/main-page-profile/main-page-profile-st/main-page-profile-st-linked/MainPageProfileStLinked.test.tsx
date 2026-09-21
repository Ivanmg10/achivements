import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfileStLinked from './MainPageProfileStLinked'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { en } from '@/translations/en'
import type { SteamProfile } from '@/types/steam'

jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/hooks/useSteamRecentAchievements', () => ({ useSteamRecentAchievements: jest.fn() }))
jest.mock('../main-page-profile-st-stats/MainPageProfileStStats', () => ({
  __esModule: true,
  default: ({ library, isLoading }: { library: unknown[]; isLoading: boolean }) => (
    <div data-testid="stats">{isLoading ? 'loading' : library.length}</div>
  ),
}))
jest.mock('../main-page-profile-st-game/MainPageProfileStGame', () => ({
  __esModule: true,
  default: ({ game, playingNow }: { game: { title: string }; playingNow: boolean }) => (
    <div data-testid="game">{game.title}|{playingNow ? 'now' : 'last'}</div>
  ),
}))
jest.mock('../main-page-profile-st-achievements/MainPageProfileStAchievements', () => ({
  __esModule: true,
  default: ({ achievements }: { achievements: unknown[] }) => <div data-testid="recent">{achievements.length}</div>,
}))

const PROFILE: SteamProfile = {
  steamid: '765',
  personaname: 'Palmera',
  avatarfull: 'https://avatars.steamstatic.com/a.jpg',
  profileurl: 'https://steamcommunity.com/id/palmera/',
  timecreated: 1533119683,
  personastate: 1,
  level: 78,
}

const RECENT = [{ id: 311210, title: 'Black Ops III' }, { id: 12210, title: 'GTA IV' }]
const LIBRARY = [...RECENT, { id: 377160, title: 'Fallout 4' }]
const retry = jest.fn()

function setup(overrides: Record<string, unknown> = {}) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: LIBRARY, libraryLoading: false, recent: RECENT, ...overrides })
  ;(useSteamRecentAchievements as jest.Mock).mockReturnValue({ achievements: [{}, {}], isLoading: false, error: null, retry: jest.fn() })
}

function renderIt(props: Partial<React.ComponentProps<typeof MainPageProfileStLinked>> = {}) {
  return render(<MainPageProfileStLinked profile={PROFILE} isLoading={false} error={null} onRetry={retry} {...props} />)
}

beforeEach(() => {
  jest.clearAllMocks()
  setup()
})

describe('header, like the RA profile', () => {
  test('shows avatar, name and a link out to Steam', () => {
    const { container } = renderIt()
    expect(screen.getByText('Palmera')).toBeInTheDocument()
    expect(container.querySelector('img')?.getAttribute('src')).toBe(PROFILE.avatarfull)

    const link = screen.getByRole('link', { name: en.steam.viewOnSteam })
    expect(link.getAttribute('href')).toBe(PROFILE.profileurl)
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  test('shows the Steam level', () => {
    renderIt()
    expect(screen.getByText(en.steam.level).textContent).toBe(`${en.steam.level}78`)
  })

  test('omits the level when Steam gave none', () => {
    renderIt({ profile: { ...PROFILE, level: null } })
    expect(screen.queryByText(en.steam.level)).not.toBeInTheDocument()
  })

  test('shows member since from the account creation date', () => {
    renderIt()
    expect(screen.getByText(`${en.profileRa.memberSince} 2018`)).toBeInTheDocument()
  })

  test('adds the country when the profile has one', () => {
    renderIt({ profile: { ...PROFILE, loccountrycode: 'ES' } })
    expect(screen.getByText('Spain')).toBeInTheDocument()
  })

  test('shows a country alone when there is no creation date', () => {
    renderIt({ profile: { ...PROFILE, timecreated: undefined, loccountrycode: 'ES' } })
    expect(screen.getByText('Spain')).toBeInTheDocument()
    expect(screen.queryByText(en.profileRa.memberSince, { exact: false })).not.toBeInTheDocument()
  })

  test('omits the member line with neither', () => {
    renderIt({ profile: { ...PROFILE, timecreated: undefined } })
    expect(screen.queryByText(en.profileRa.memberSince, { exact: false })).not.toBeInTheDocument()
  })

  test('falls back to a placeholder avatar and no link when Steam gave neither', () => {
    const { container } = renderIt({ profile: { ...PROFILE, avatarfull: undefined, profileurl: undefined } })
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

describe('status, in words as well as a dot', () => {
  test('in game', () => {
    renderIt({ profile: { ...PROFILE, gameextrainfo: 'Black Ops III' } })
    expect(screen.getByText(`${en.steam.nowPlaying}: Black Ops III`)).toBeInTheDocument()
  })

  test('online', () => {
    renderIt()
    expect(screen.getByText(en.steam.online)).toBeInTheDocument()
  })

  test('offline, including when Steam gives no state', () => {
    renderIt({ profile: { ...PROFILE, personastate: undefined } })
    expect(screen.getByText(en.steam.offline)).toBeInTheDocument()
  })
})

describe('featured game', () => {
  test('is the game running right now, when Steam reports one', () => {
    renderIt({ profile: { ...PROFILE, gameid: '377160', gameextrainfo: 'Fallout 4' } })
    expect(screen.getByTestId('game')).toHaveTextContent('Fallout 4|now')
  })

  test('is otherwise the last game played', () => {
    renderIt()
    expect(screen.getByTestId('game')).toHaveTextContent('Black Ops III|last')
  })

  test('falls back to the last played when the running game is not in the lists', () => {
    renderIt({ profile: { ...PROFILE, gameid: '999' } })
    expect(screen.getByTestId('game')).toHaveTextContent('Black Ops III|last')
  })

  test('is left out when nothing was played recently', () => {
    setup({ recent: [] })
    renderIt()
    expect(screen.queryByTestId('game')).not.toBeInTheDocument()
  })
})

test('hands the library to the stats and recent unlocks to their list', () => {
  renderIt()
  expect(screen.getByTestId('stats')).toHaveTextContent('3')
  expect(screen.getByTestId('recent')).toHaveTextContent('2')
})

test('shows a skeleton while the profile loads', () => {
  const { container } = renderIt({ isLoading: true })
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  expect(screen.queryByText('Palmera')).not.toBeInTheDocument()
})

test('announces an error with the privacy hint and a retry', () => {
  renderIt({ error: 'boom', profile: null })
  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.profileError)
  expect(screen.getByText(en.steam.privateProfileHint)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(retry).toHaveBeenCalledTimes(1)
})

test('treats a missing profile with no error as an error, not a blank card', () => {
  renderIt({ profile: null })
  expect(screen.getByRole('alert')).toBeInTheDocument()
})
