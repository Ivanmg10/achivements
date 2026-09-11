import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useGamesData } from '@/context/GamesDataContext'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useGamesByCategory } from './useGamesByCategory'
import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'

jest.mock('@/context/GamesDataContext', () => ({ useGamesData: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))

const completed = [
  { GameID: 1, ConsoleID: 21, ConsoleName: 'PS2', NumAwarded: 5, PctWon: '0.5', HardcoreMode: '0' },
  { GameID: 2, ConsoleID: 21, ConsoleName: 'PS2', NumAwarded: 10, PctWon: '1', HardcoreMode: '0' },
  { GameID: 3, ConsoleID: 21, ConsoleName: 'Events', NumAwarded: 3, PctWon: '1', HardcoreMode: '0' },
] as unknown as RetroAchievementsGameCompleted[]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useGamesData as jest.Mock).mockReturnValue({ all: completed, isLoading: false })
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
})

test('derives "playing" games from the shared context without fetching getGamesCompleted', async () => {
  const { result } = renderHook(() => useGamesByCategory('playing'))
  await waitFor(() => expect(result.current.loading).toBe(false))

  expect((result.current.games as RetroAchievementsGameCompleted[]).map((g) => g.GameID)).toEqual([1])
  expect(fetchWithRetry).not.toHaveBeenCalled()
})

test('derives "completed" games from the shared context, excluding Events consoles', async () => {
  const { result } = renderHook(() => useGamesByCategory('completed'))
  await waitFor(() => expect(result.current.loading).toBe(false))

  expect((result.current.games as RetroAchievementsGameCompleted[]).map((g) => g.GameID)).toEqual([2])
  expect(fetchWithRetry).not.toHaveBeenCalled()
})

test('only fetches getWantPlayGames for the wantToPlay category', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({
    Results: [
      { ID: 1, ConsoleName: 'PS2' },
      { ID: 99, ConsoleName: 'PS2' },
    ],
  })

  const { result } = renderHook(() => useGamesByCategory('wantToPlay'))
  await waitFor(() => expect(result.current.loading).toBe(false))

  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getWantPlayGames')
  expect((result.current.games as WantToPlayGame[]).map((g) => g.ID)).toEqual([99])
})

test('filters by consoleId when provided', async () => {
  const { result } = renderHook(() => useGamesByCategory('completed', '21'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.games).toHaveLength(1)

  const { result: otherConsole } = renderHook(() => useGamesByCategory('completed', '999'))
  await waitFor(() => expect(otherConsole.current.loading).toBe(false))
  expect(otherConsole.current.games).toHaveLength(0)
})
