import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useGamesData } from '@/context/GamesDataContext'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useAllGamesGlobal } from './useAllGamesGlobal'
import { RetroAchievementsGameCompleted } from '@/types/types'

jest.mock('@/context/GamesDataContext', () => ({ useGamesData: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))

const completed = [
  { GameID: 1, ConsoleName: 'PS2', NumAwarded: 5, PctWon: '0.5', HardcoreMode: '0' },
  { GameID: 2, ConsoleName: 'PS2', NumAwarded: 10, PctWon: '1', HardcoreMode: '0' },
  { GameID: 3, ConsoleName: 'Events', NumAwarded: 3, PctWon: '1', HardcoreMode: '0' },
] as unknown as RetroAchievementsGameCompleted[]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useGamesData as jest.Mock).mockReturnValue({ all: completed, isLoading: false })
})

test('does not fetch getGamesCompleted itself — it reuses the shared GamesDataContext', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ Results: [] })

  const { result } = renderHook(() => useAllGamesGlobal())
  await waitFor(() => expect(result.current.loading).toBe(false))

  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getWantPlayGames')
  expect(fetchWithRetry).not.toHaveBeenCalledWith('/api/getGamesCompleted')
})

test('derives playing/completed from the shared context data, excluding Events consoles', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ Results: [] })

  const { result } = renderHook(() => useAllGamesGlobal())
  await waitFor(() => expect(result.current.loading).toBe(false))

  expect(result.current.playing.map((g) => g.GameID)).toEqual([1])
  expect(result.current.completed.map((g) => g.GameID)).toEqual([2])
})

test('filters out want-to-play games already started', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({
    Results: [
      { ID: 1, ConsoleName: 'PS2' },
      { ID: 99, ConsoleName: 'PS2' },
    ],
  })

  const { result } = renderHook(() => useAllGamesGlobal())
  await waitFor(() => expect(result.current.loading).toBe(false))

  expect(result.current.wantToPlay.map((g) => g.ID)).toEqual([99])
})

test('stays loading while the shared context is still loading', () => {
  ;(useGamesData as jest.Mock).mockReturnValue({ all: [], isLoading: true })
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ Results: [] })

  const { result } = renderHook(() => useAllGamesGlobal())
  expect(result.current.loading).toBe(true)
})
