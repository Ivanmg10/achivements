import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePsnFavoriteTrophies } from './usePsnFavoriteTrophies'
import { notify } from '@/lib/notify'
import type { PsnTrophy } from '@/types/psn'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const TROPHY = { id: 3, name: 'Platinum' } as PsnTrophy

function json(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  global.fetch = jest.fn(() => json([{ psn_trophy_id: 1 }])) as unknown as typeof fetch
})

test('does not fetch, and cannot pin, when signed out', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  const { result } = renderHook(() => usePsnFavoriteTrophies(2018800, 'Astro Bot'))
  expect(global.fetch).not.toHaveBeenCalled()
  expect(result.current.canPin).toBe(false)
})

test("loads the game's pinned trophies", async () => {
  const { result } = renderHook(() => usePsnFavoriteTrophies(2018800, 'Astro Bot'))
  await waitFor(() => expect(result.current.pinned.has(1)).toBe(true))
  expect(global.fetch).toHaveBeenCalledWith('/api/favorites?source=psn&gameId=2018800')
})

test('reports a failed load', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({}, false))
  const { result } = renderHook(() => usePsnFavoriteTrophies(2018800, 'Astro Bot'))
  await waitFor(() => expect(result.current.error).not.toBeNull())
})

test('pins a trophy with its PSN identity', async () => {
  const { result } = renderHook(() => usePsnFavoriteTrophies(2018800, 'Astro Bot'))
  await waitFor(() => expect(result.current.pinned.has(1)).toBe(true))
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({ ok: true }))
  await act(() => result.current.toggle(TROPHY))
  expect(result.current.pinned.has(3)).toBe(true)
  const [url, init] = (global.fetch as jest.Mock).mock.calls[1]
  expect(url).toBe('/api/favorites')
  expect(JSON.parse(init.body)).toMatchObject({ source: 'psn', psnTrophyId: 3, gameId: 2018800, gameTitle: 'Astro Bot' })
  expect(notify.success).toHaveBeenCalled()
})

test('unpins a pinned trophy', async () => {
  const { result } = renderHook(() => usePsnFavoriteTrophies(2018800, 'Astro Bot'))
  await waitFor(() => expect(result.current.pinned.has(1)).toBe(true))
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({ ok: true }))
  await act(() => result.current.toggle({ ...TROPHY, id: 1 }))
  expect(result.current.pinned.has(1)).toBe(false)
  expect(global.fetch).toHaveBeenLastCalledWith('/api/favorites?psnTrophyId=1&gameId=2018800', { method: 'DELETE' })
})

test('rolls back, and says so, when the pin request fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const { result } = renderHook(() => usePsnFavoriteTrophies(2018800, 'Astro Bot'))
  await waitFor(() => expect(result.current.pinned.has(1)).toBe(true))
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({}, false))
  await act(() => result.current.toggle(TROPHY))
  expect(result.current.pinned.has(3)).toBe(false)
  expect(result.current.error).not.toBeNull()
  expect(notify.error).toHaveBeenCalled()
})
