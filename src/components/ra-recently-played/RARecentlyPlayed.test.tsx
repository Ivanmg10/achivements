import { render, screen, fireEvent } from '@testing-library/react'
import RARecentlyPlayed from './RARecentlyPlayed'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { MainViewProvider } from '@/context/MainViewContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'

jest.mock('@/hooks/useRecentlyPlayedGames', () => ({
  useRecentlyPlayedGames: jest.fn(),
}))
jest.mock('@/context/SteamGamesDataContext', () => ({
  useSteamGamesData: jest.fn(() => ({ recent: [] })),
}))

function renderWithProviders() {
  return render(
    <MainViewProvider>
      <RARecentlyPlayed />
    </MainViewProvider>
  )
}

test('shows a loading skeleton while fetching, not the empty state', () => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [], isLoading: true })
  const { container } = renderWithProviders()
  expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  expect(screen.queryByText('No games')).not.toBeInTheDocument()
})

test('shows an empty state once loading finishes with no recently played games, instead of an empty skeleton list', () => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [], isLoading: false })
  const { container } = renderWithProviders()
  expect(screen.getByText('No games')).toBeInTheDocument()
  expect(container.querySelectorAll('.animate-pulse').length).toBe(0)
})

describe('merged RA + Steam feed', () => {
  const RA_GAME = {
    GameID: 730, Title: 'RA Game', ImageIcon: '', ConsoleName: 'SNES', LastPlayed: '2024-01-01 12:00:00',
    NumPossibleAchievements: 10, PossibleScore: 100, NumAchieved: 1, ScoreAchieved: 10,
    NumAchievedHardcore: 0, ScoreAchievedHardcore: 0,
  }
  // Same numeric id as the RA game on purpose — they must stay distinct.
  const STEAM_GAME = {
    _source: 'steam', id: 730, title: 'Steam Game', imageIcon: '', consoleName: 'Steam',
    maxPossible: 0, numAwarded: 0, pctWon: 0, lastPlayed: '2024-06-01T12:00:00.000Z',
    playtimeForever: 60, playtime2Weeks: 0, imgLogoUrl: '', hasStats: false, achievementsLoaded: false,
  }

  function renderFeed(steam: unknown[] = [STEAM_GAME]) {
    ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [RA_GAME], isLoading: false })
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ recent: steam })
    return renderWithProviders()
  }

  afterEach(() => {
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ recent: [] })
  })

  test('interleaves Steam games with RA games, newest first', () => {
    renderFeed()
    const titles = screen.getAllByText(/^(RA|Steam) Game$/).map((e) => e.textContent)
    expect(titles).toEqual(['Steam Game', 'RA Game'])
  })

  test('keeps an RA game and a Steam app with the same id as two entries', () => {
    renderFeed()
    expect(screen.getByText('RA Game')).toBeInTheDocument()
    expect(screen.getByText('Steam Game')).toBeInTheDocument()
  })

  test('expanding a Steam game shows only that game', () => {
    renderFeed()
    fireEvent.click(screen.getByRole('button', { name: /Steam Game/ }))

    expect(screen.getByText('Steam Game')).toBeInTheDocument()
    expect(screen.queryByText('RA Game')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Steam Game/ }).getAttribute('aria-expanded')).toBe('true')
  })

  test('expanding a Steam game does not call the RA progression endpoint', () => {
    global.fetch = jest.fn()
    renderFeed()
    fireEvent.click(screen.getByRole('button', { name: /Steam Game/ }))
    expect(fetch).not.toHaveBeenCalled()
  })

  test('collapsing a Steam game brings the full feed back', () => {
    renderFeed()
    const steamButton = () => screen.getByRole('button', { name: /Steam Game/ })
    fireEvent.click(steamButton())
    fireEvent.click(steamButton())
    expect(screen.getByText('RA Game')).toBeInTheDocument()
  })

  test('a user with only RA sees an unchanged feed', () => {
    renderFeed([])
    expect(screen.getByText('RA Game')).toBeInTheDocument()
    expect(screen.queryByText('Steam Game')).not.toBeInTheDocument()
  })
})
