import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useSteamFavoriteAchievements } from './useSteamFavoriteAchievements'
import type { SteamAchievementUnified } from '@/types/steam'

const ACH = { apiname: 'ACH_WIN', title: 'Win' } as SteamAchievementUnified

function json(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  global.fetch = jest.fn(() => json([{ steam_apiname: 'ACH_OLD' }])) as unknown as typeof fetch
})

test('does not fetch, and cannot pin, when signed out', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  const { result } = renderHook(() => useSteamFavoriteAchievements(620, 'Portal 2'))
  expect(global.fetch).not.toHaveBeenCalled()
  expect(result.current.canPin).toBe(false)
})

test('loads the game’s pinned Steam achievements', async () => {
  const { result } = renderHook(() => useSteamFavoriteAchievements(620, 'Portal 2'))
  await waitFor(() => expect(result.current.pinned.has('ACH_OLD')).toBe(true))
  expect(global.fetch).toHaveBeenCalledWith('/api/favorites?source=steam&gameId=620')
})

test('reports a failed load', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({}, false))
  const { result } = renderHook(() => useSteamFavoriteAchievements(620, 'Portal 2'))
  await waitFor(() => expect(result.current.error).not.toBeNull())
})

test('pins an achievement with its Steam identity', async () => {
  const { result } = renderHook(() => useSteamFavoriteAchievements(620, 'Portal 2'))
  await waitFor(() => expect(result.current.pinned.has('ACH_OLD')).toBe(true))
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({ ok: true }))

  await act(() => result.current.toggle(ACH))

  expect(result.current.pinned.has('ACH_WIN')).toBe(true)
  const [url, init] = (global.fetch as jest.Mock).mock.calls[1]
  expect(url).toBe('/api/favorites')
  expect(JSON.parse(init.body)).toMatchObject({
    source: 'steam', steamApiname: 'ACH_WIN', gameId: 620, gameTitle: 'Portal 2',
  })
})

test('unpins a pinned achievement', async () => {
  const { result } = renderHook(() => useSteamFavoriteAchievements(620, 'Portal 2'))
  await waitFor(() => expect(result.current.pinned.has('ACH_OLD')).toBe(true))
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({ ok: true }))

  await act(() => result.current.toggle({ ...ACH, apiname: 'ACH_OLD' }))

  expect(result.current.pinned.has('ACH_OLD')).toBe(false)
  expect(global.fetch).toHaveBeenLastCalledWith('/api/favorites?steamApiname=ACH_OLD&gameId=620', { method: 'DELETE' })
})

test('rolls back when the pin request fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const { result } = renderHook(() => useSteamFavoriteAchievements(620, 'Portal 2'))
  await waitFor(() => expect(result.current.pinned.has('ACH_OLD')).toBe(true))
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({}, false))

  await act(() => result.current.toggle(ACH))

  expect(result.current.pinned.has('ACH_WIN')).toBe(false)
  expect(result.current.error).not.toBeNull()
})
