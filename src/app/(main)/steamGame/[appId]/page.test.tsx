jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/hooks/useSteamAchievements', () => ({ useSteamAchievements: jest.fn() }))
jest.mock('@/hooks/useSteamGameDetails', () => ({ useSteamGameDetails: jest.fn() }))
jest.mock('@/components/loading-page/LoadingPage', () => ({
  __esModule: true,
  default: () => <div data-testid="loading" />,
}))
jest.mock('@/components/steam/steam-game-hero-background/SteamGameHeroBackground', () => ({
  __esModule: true,
  default: ({ appId }: { appId: number }) => <div data-testid="hero">{appId}</div>,
}))
jest.mock('@/components/steam/steam-game-info-header/SteamGameInfoHeader', () => ({
  __esModule: true,
  default: (props: { title: string; game: unknown; counts: { earned: number; total: number } | null }) => (
    <div data-testid="header">
      {props.title}|{props.game ? 'owned' : 'not-owned'}|{props.counts ? `${props.counts.earned}/${props.counts.total}` : 'no-counts'}
    </div>
  ),
}))
jest.mock('@/components/steam/steam-game-info-table/SteamGameInfoTable', () => ({
  __esModule: true,
  default: ({ achievements }: { achievements: unknown[] }) => <div data-testid="table">{achievements.length}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import SteamGamePage from './page'
import { useParams, notFound } from 'next/navigation'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { useSteamGameDetails } from '@/hooks/useSteamGameDetails'
import { en } from '@/translations/en'

const GAME = {
  _source: 'steam', id: 377160, title: 'Fallout 4', achievementsLoaded: true, maxPossible: 84, numAwarded: 20,
}
const retry = jest.fn()

function setup({
  appId = '377160',
  linked = true,
  library = [GAME],
  libraryLoading = false,
  achievements = [{ earned: true }, { earned: false }] as unknown[],
  achievementsLoading = false,
  achievementsError = null as string | null,
  details = null as unknown,
  detailsLoading = false,
} = {}) {
  ;(useParams as jest.Mock).mockReturnValue({ appId })
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: linked, library, libraryLoading })
  ;(useSteamAchievements as jest.Mock).mockReturnValue({
    achievements, isLoading: achievementsLoading, error: achievementsError, retry,
  })
  ;(useSteamGameDetails as jest.Mock).mockReturnValue({ details, isLoading: detailsLoading })
}

beforeEach(() => jest.clearAllMocks())

test('builds the page from the hero, header and achievement table', () => {
  setup()
  render(<SteamGamePage />)

  expect(screen.getByTestId('hero')).toHaveTextContent('377160')
  expect(screen.getByTestId('table')).toHaveTextContent('2')
  expect(useSteamAchievements).toHaveBeenCalledWith(377160)
  expect(useSteamGameDetails).toHaveBeenCalledWith(377160)
})

test('takes title and ownership from the library, counts from the loaded achievements', () => {
  setup()
  render(<SteamGamePage />)
  expect(screen.getByTestId('header')).toHaveTextContent('Fallout 4|owned|1/2')
})

test('falls back to library counts while achievements are still loading', () => {
  setup({ achievements: [], achievementsLoading: true })
  render(<SteamGamePage />)
  expect(screen.getByTestId('header')).toHaveTextContent('20/84')
  expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
})

test('works for a game outside the library, titled from the store', () => {
  setup({ library: [], details: { name: 'Portal 2' }, achievements: [] })
  render(<SteamGamePage />)
  expect(screen.getByTestId('header')).toHaveTextContent('Portal 2|not-owned|no-counts')
})

test('falls back to the app id when nothing names the game', () => {
  setup({ library: [], details: null, achievements: [] })
  render(<SteamGamePage />)
  expect(screen.getByTestId('header')).toHaveTextContent('App 377160')
})

test('shows the loading page until something can title it', () => {
  setup({ library: [], libraryLoading: true, detailsLoading: true })
  render(<SteamGamePage />)
  expect(screen.getByTestId('loading')).toBeInTheDocument()
})

test('does not wait for store details when the library already has the game', () => {
  setup({ detailsLoading: true })
  render(<SteamGamePage />)
  expect(screen.getByTestId('header')).toBeInTheDocument()
})

test('announces an achievements error with the privacy hint and a retry', () => {
  setup({ achievements: [], achievementsError: 'boom' })
  render(<SteamGamePage />)

  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.achievementsError)
  expect(screen.getByText(en.steam.privateProfileHint)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(retry).toHaveBeenCalledTimes(1)
})

test('says so for a game with no achievements', () => {
  setup({ achievements: [] })
  render(<SteamGamePage />)
  expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
  expect(screen.queryByTestId('table')).not.toBeInTheDocument()
})

test('without Steam linked, points to settings and fetches nothing', () => {
  setup({ linked: false })
  render(<SteamGamePage />)

  expect(screen.getByRole('link', { name: en.userData.steamConnect }).getAttribute('href')).toBe('/user')
  expect(useSteamAchievements).toHaveBeenCalledWith(null)
  expect(useSteamGameDetails).toHaveBeenCalledWith(null)
})

test.each(['abc', '-1', '1.5'])('a non-numeric app id %p is a 404', (appId) => {
  setup({ appId })
  expect(() => render(<SteamGamePage />)).toThrow('NEXT_NOT_FOUND')
  expect(notFound).toHaveBeenCalled()
})
