jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))

import { act, renderHook, waitFor } from '@testing-library/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { usePinnedAchievements } from './usePinnedAchievements'
import type { PinnedAchievement } from '@/types/types'

const RA = { source: 'ra', achievement_id: 5, game_id: 1, game_title: 'Zelda', snapshot: {}, num_distinct_players: 0 } as unknown as PinnedAchievement
const RA2 = { ...RA, achievement_id: 6 } as PinnedAchievement
const STEAM = {
  source: 'steam', steam_apiname: 'WIN', game_id: 620, game_title: 'Portal 2', snapshot: {}, num_distinct_players: 0,
} as unknown as PinnedAchievement

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200 })) as unknown as typeof fetch
})

test('loads the pins of both platforms together', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([STEAM, RA])
  const { result } = renderHook(() => usePinnedAchievements())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/favorites?source=all')
  expect(result.current.pinned).toEqual([STEAM, RA])
})

test('retries in the background after a failed load', async () => {
  jest.useFakeTimers()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetchWithRetry as jest.Mock).mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce([RA])
  const { result } = renderHook(() => usePinnedAchievements())
  await act(async () => {})
  expect(result.current.isLoading).toBe(true)
  await act(async () => { jest.advanceTimersByTime(3_000) })
  expect(result.current.pinned).toEqual([RA])
  jest.useRealTimers()
})

test('unpins RA by id and Steam by game + apiname', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([RA, STEAM])
  const { result } = renderHook(() => usePinnedAchievements())
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  await act(() => result.current.unpin(RA))
  expect(global.fetch).toHaveBeenCalledWith('/api/favorites?achievementId=5', { method: 'DELETE' })
  await act(() => result.current.unpin(STEAM))
  expect(global.fetch).toHaveBeenCalledWith('/api/favorites?steamApiname=WIN&gameId=620', { method: 'DELETE' })
  expect(result.current.pinned).toEqual([])
})

test('puts the row back in place when unpinning fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([RA, RA2])
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
  const { result } = renderHook(() => usePinnedAchievements())
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  await act(() => result.current.unpin(RA))
  expect(result.current.pinned).toEqual([RA, RA2])
})
