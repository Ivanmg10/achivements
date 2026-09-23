import { render, screen, waitFor } from '@testing-library/react'
import MainPageAbandoned from './MainPageAbandoned'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { RetroAchievementsGameCompleted } from '@/types/types'

jest.mock('@/hooks/useRecentlyPlayedGames', () => ({
  useRecentlyPlayedGames: jest.fn(),
}))

jest.mock('@/lib/fetchWithRetry', () => ({
  fetchWithRetry: jest.fn(),
}))

function daysAgo(n: number) {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

const playing = [
  { GameID: 1, Title: 'Abandoned Game', ConsoleName: 'PS2', ImageIcon: '/icon.png', PctWon: '0.5', HardcoreMode: '0' },
] as unknown as RetroAchievementsGameCompleted[]

beforeEach(() => {
  jest.clearAllMocks()
})

test('uses LastPlayed from the shared recently-played list instead of calling getGamesLastPlayed', async () => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({
    games: [{ GameID: 1, LastPlayed: daysAgo(40) }],
    isLoading: false,
  })

  render(<MainPageAbandoned playing={playing} />)

  await waitFor(() => expect(screen.getByText('Abandoned Game')).toBeInTheDocument())
  expect(fetchWithRetry).not.toHaveBeenCalled()
})

test('falls back to getGamesLastPlayed only for games missing from the recently-played list', async () => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [], isLoading: false })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ 1: daysAgo(45) })

  render(<MainPageAbandoned playing={playing} />)

  await waitFor(() => expect(screen.getByText('Abandoned Game')).toBeInTheDocument())
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getGamesLastPlayed?gameIds=1')
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
})

test('shows the loading skeleton while the shared recently-played list is still loading', () => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [], isLoading: true })

  const { container } = render(<MainPageAbandoned playing={playing} />)

  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  expect(fetchWithRetry).not.toHaveBeenCalled()
})

test('does not treat a recently played game (LastPlayed within the window) as abandoned', async () => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({
    games: [{ GameID: 1, LastPlayed: daysAgo(2) }],
    isLoading: false,
  })

  render(<MainPageAbandoned playing={playing} />)

  await waitFor(() => expect(screen.getByText('No abandoned games')).toBeInTheDocument())
  expect(screen.queryByText('Abandoned Game')).not.toBeInTheDocument()
})

describe('with Steam games', () => {
  function steamGame(id: number, idleDays: number, over: Record<string, unknown> = {}) {
    return {
      _source: 'steam', id, title: `Steam ${id}`, imageIcon: '', consoleName: 'Steam', maxPossible: 10, numAwarded: 4,
      pctWon: 40, lastPlayed: new Date(Date.now() - idleDays * 24 * 60 * 60 * 1000).toISOString(),
      playtimeForever: 100, playtime2Weeks: 0, imgLogoUrl: '', hasStats: true, achievementsLoaded: true, ...over,
    } as never
  }

  beforeEach(() => {
    ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [{ GameID: 1, LastPlayed: daysAgo(40) }], isLoading: false })
  })

  test('mixes idle Steam games in progress with RA ones, longest idle first', () => {
    render(<MainPageAbandoned playing={playing} steamGames={[steamGame(620, 90), steamGame(621, 5)]} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/steamGame/620', '/gameInfo/1'])
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  test('leaves out Steam games that are perfect or not started', () => {
    render(
      <MainPageAbandoned
        playing={[]}
        steamGames={[steamGame(1, 90, { numAwarded: 10, pctWon: 100 }), steamGame(2, 90, { numAwarded: 0, pctWon: 0 })]}
      />,
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
