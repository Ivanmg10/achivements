import { renderHook, waitFor } from '@testing-library/react'
import { useGameCandidates } from './useGameCandidates'
import { useGamesData } from '@/context/GamesDataContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { toSteamGameProgress } from '@/utils/steamMappers'

jest.mock('@/context/GamesDataContext', () => ({ useGamesData: jest.fn() }))
jest.mock('@/hooks/useRecentlyPlayedGames', () => ({ useRecentlyPlayedGames: jest.fn() }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))

const RA = { GameID: 730, Title: 'RA Game', ImageIcon: '/i.png', ConsoleID: 1, ConsoleName: 'SNES', MaxPossible: 10, NumAwarded: 5, PctWon: '0.5', HardcoreMode: '0' }
const STEAM = toSteamGameProgress({ appid: 730, name: 'CS2', playtime_forever: 60 })

beforeEach(() => {
  jest.clearAllMocks()
  ;(useGamesData as jest.Mock).mockReturnValue({ all: [RA] })
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [] })
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: [STEAM] })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ Results: [] })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('offers RA and Steam games together, kept apart by key', () => {
  const { result } = renderHook(() => useGameCandidates(false))
  expect(result.current.map((c) => c.key)).toEqual(['ra:730', 'steam:730'])
})

test('fetches the want-to-play list only once a picker opens, and only once', async () => {
  const { rerender } = renderHook(({ on }) => useGameCandidates(on), { initialProps: { on: false } })
  expect(fetchWithRetry).not.toHaveBeenCalled()

  rerender({ on: true })
  rerender({ on: true })
  await waitFor(() => expect(fetchWithRetry).toHaveBeenCalledTimes(1))
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getWantPlayGames')
})

test('adds want-to-play games once they arrive', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({
    Results: [{ ID: 9, Title: 'Wanted', GameTitle: 'Wanted', ImageIcon: '', ConsoleID: 1, ConsoleName: 'NES', PointsTotal: 0, AchievementsPublished: 3 }],
  })
  const { result } = renderHook(() => useGameCandidates(true))
  await waitFor(() => expect(result.current.map((c) => c.key)).toContain('ra:9'))
})

test('keeps working from the other lists when want-to-play fails', async () => {
  ;(fetchWithRetry as jest.Mock).mockRejectedValue(new Error('down'))
  const { result } = renderHook(() => useGameCandidates(true))
  await waitFor(() => expect(console.error).toHaveBeenCalled())
  expect(result.current).toHaveLength(2)
})

test('tolerates missing lists and an empty want-to-play payload', async () => {
  ;(useGamesData as jest.Mock).mockReturnValue({})
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({})
  ;(useSteamGamesData as jest.Mock).mockReturnValue({})
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(null)
  const { result } = renderHook(() => useGameCandidates(true))
  await waitFor(() => expect(fetchWithRetry).toHaveBeenCalled())
  expect(result.current).toEqual([])
})
