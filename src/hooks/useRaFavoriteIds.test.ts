jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
import { act, renderHook, waitFor } from '@testing-library/react'
import { useRaFavoriteIds } from './useRaFavoriteIds'
import type { RetroAchievement } from '@/types/types'
import { en } from '@/translations/en'
import { notify } from '@/lib/notify'

const ACH = { ID: 7, Title: 'First blood' } as RetroAchievement
const META = { gameTitle: 'Zelda', numDistinctPlayers: 10 }

beforeEach(() => {
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

function ok(body: unknown = {}) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) }
}

test('loads the pinned ids for the game', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce(ok([{ achievement_id: 7 }, { achievement_id: 9 }]))
  const { result } = renderHook(() => useRaFavoriteIds(1))
  await waitFor(() => expect(result.current.favoritedIds).toEqual(new Set([7, 9])))
  expect(fetch).toHaveBeenCalledWith('/api/favorites?gameId=1')
})

test('asks for nothing until enabled', () => {
  renderHook(() => useRaFavoriteIds(1, false))
  expect(fetch).not.toHaveBeenCalled()
})

test('a failed load leaves the stars empty and logs it', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
  const { result } = renderHook(() => useRaFavoriteIds(1))
  await waitFor(() => expect(console.error).toHaveBeenCalled())
  expect(result.current.favoritedIds.size).toBe(0)
})

test('pins with a POST and keeps the star on', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok())
  const { result } = renderHook(() => useRaFavoriteIds(1))
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

  await act(() => result.current.toggleFavorite(ACH, META))
  expect(fetch).toHaveBeenLastCalledWith('/api/favorites', expect.objectContaining({ method: 'POST' }))
  expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)).toMatchObject({ gameId: 1, gameTitle: 'Zelda' })
  expect(result.current.favoritedIds.has(7)).toBe(true)
})

test('undoes the pin when the server refuses it', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce(ok([])).mockResolvedValueOnce({ ok: false, status: 500 })
  const { result } = renderHook(() => useRaFavoriteIds(1))
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

  await act(() => result.current.toggleFavorite(ACH, META))
  expect(result.current.favoritedIds.has(7)).toBe(false)
})

test('undoes the unpin when the network fails', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce(ok([{ achievement_id: 7 }])).mockRejectedValueOnce(new Error('offline'))
  const { result } = renderHook(() => useRaFavoriteIds(1))
  await waitFor(() => expect(result.current.favoritedIds.has(7)).toBe(true))

  await act(() => result.current.toggleFavorite(ACH, META))
  expect(fetch).toHaveBeenLastCalledWith('/api/favorites?achievementId=7', { method: 'DELETE' })
  expect(result.current.favoritedIds.has(7)).toBe(true)
})

test('a saved pin is announced, a failed one too', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok())
  const { result } = renderHook(() => useRaFavoriteIds(1))
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  await act(() => result.current.toggleFavorite(ACH, META))
  expect(notify.success).toHaveBeenCalledWith(en.toast.achievementsUpdated)

  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) })
  await act(() => result.current.toggleFavorite(ACH, META))
  expect(notify.error).toHaveBeenCalledWith(en.toast.achievementsFailed)
})
