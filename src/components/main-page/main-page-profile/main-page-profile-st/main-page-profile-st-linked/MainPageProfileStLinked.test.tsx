import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfileStLinked from './MainPageProfileStLinked'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { en } from '@/translations/en'
import type { SteamGameProgress, SteamPlayerSummary } from '@/types/steam'

jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))

const PROFILE: SteamPlayerSummary = {
  steamid: '765',
  personaname: 'Ivan',
  avatarfull: 'https://avatars.steamstatic.com/a.jpg',
  profileurl: 'https://steamcommunity.com/id/ivan/',
}

function game(minutes: number, overrides: Partial<SteamGameProgress> = {}): SteamGameProgress {
  return {
    ...toSteamGameProgress({ appid: minutes, name: 'G', playtime_forever: minutes }),
    ...overrides,
  }
}

const LIBRARY = [
  game(600, { achievementsLoaded: true, maxPossible: 10, numAwarded: 10 }),
  game(120, { achievementsLoaded: true, maxPossible: 10, numAwarded: 4 }),
  game(0),
]

const retry = jest.fn()

function setLibrary(overrides: Record<string, unknown> = {}) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: LIBRARY, libraryLoading: false, ...overrides })
}

function renderIt(props: Partial<React.ComponentProps<typeof MainPageProfileStLinked>> = {}) {
  return render(
    <MainPageProfileStLinked profile={PROFILE} isLoading={false} error={null} onRetry={retry} {...props} />,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  setLibrary()
})

test('shows persona, avatar and a link to the Steam profile', () => {
  const { container } = renderIt()

  expect(screen.getByText('Ivan')).toBeInTheDocument()
  expect(container.querySelector('img')?.getAttribute('src')).toBe(PROFILE.avatarfull)

  const link = screen.getByRole('link', { name: en.steam.viewOnSteam })
  expect(link.getAttribute('href')).toBe(PROFILE.profileurl)
  expect(link.getAttribute('target')).toBe('_blank')
  expect(link.getAttribute('rel')).toContain('noopener')
})

test('omits the external link when Steam gave no profile URL', () => {
  renderIt({ profile: { ...PROFILE, profileurl: undefined } })
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('falls back to a placeholder avatar', () => {
  const { container } = renderIt({ profile: { ...PROFILE, avatarfull: undefined } })
  expect(container.querySelector('img')).toBeNull()
})

test('shows what they are playing right now, if anything', () => {
  const { rerender } = renderIt({ profile: { ...PROFILE, gameextrainfo: 'Portal 2' } })
  expect(screen.getByText(`${en.steam.nowPlaying}: Portal 2`)).toBeInTheDocument()

  rerender(<MainPageProfileStLinked profile={PROFILE} isLoading={false} error={null} onRetry={retry} />)
  expect(screen.queryByText(en.steam.nowPlaying, { exact: false })).not.toBeInTheDocument()
})

test('totals the library: games owned, playtime, completed', () => {
  renderIt()

  const value = (label: string) => screen.getByText(label).nextElementSibling?.textContent
  expect(value(en.steam.gamesOwned)).toBe('3')
  expect(value(en.steam.totalPlaytime)).toBe('12 h')
  expect(value(en.categories.completed)).toBe('1')
})

test('shows placeholders while the library is still loading', () => {
  setLibrary({ libraryLoading: true })
  renderIt()
  expect(screen.getAllByText('—')).toHaveLength(3)
})

test('shows a skeleton while the profile loads', () => {
  const { container } = renderIt({ isLoading: true })
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  expect(screen.queryByText('Ivan')).not.toBeInTheDocument()
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
