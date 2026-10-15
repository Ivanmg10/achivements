import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useXboxFavoriteAchievements } from './useXboxFavoriteAchievements'
import { notify } from '@/lib/notify'
import { SubjectContext } from '@/context/SubjectContext'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const ACHIEVEMENT = xboxAchievementFixture({ id: '3', name: 'Gold' })
const GAME = 1738914043

function json(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  global.fetch = jest.fn(() => json([{ xbox_achievement_id: '1' }])) as unknown as typeof fetch
})

test('does not fetch, and cannot pin, when signed out', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  const { result } = renderHook(() => useXboxFavoriteAchievements(GAME, 'Halo'))
  expect(global.fetch).not.toHaveBeenCalled()
  expect(result.current.canPin).toBe(false)
})

test("loads the game's pinned achievements", async () => {
  const { result } = renderHook(() => useXboxFavoriteAchievements(GAME, 'Halo'))
  await waitFor(() => expect(result.current.pinned.has('1')).toBe(true))
  expect(global.fetch).toHaveBeenCalledWith(`/api/favorites?source=xbox&gameId=${GAME}`)
})

test('reports a failed load', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({}, false))
  const { result } = renderHook(() => useXboxFavoriteAchievements(GAME, 'Halo'))
  await waitFor(() => expect(result.current.error).not.toBeNull())
})

test('pins an achievement with its Xbox identity', async () => {
  const { result } = renderHook(() => useXboxFavoriteAchievements(GAME, 'Halo'))
  await waitFor(() => expect(result.current.pinned.has('1')).toBe(true))
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({ ok: true }))
  await act(() => result.current.toggle(ACHIEVEMENT))
  expect(result.current.pinned.has('3')).toBe(true)
  const [url, init] = (global.fetch as jest.Mock).mock.calls[1]
  expect(url).toBe('/api/favorites')
  expect(JSON.parse(init.body)).toMatchObject({ source: 'xbox', xboxAchievementId: '3', gameId: GAME, gameTitle: 'Halo' })
  expect(notify.success).toHaveBeenCalled()
})

test('unpins a pinned achievement', async () => {
  const { result } = renderHook(() => useXboxFavoriteAchievements(GAME, 'Halo'))
  await waitFor(() => expect(result.current.pinned.has('1')).toBe(true))
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({ ok: true }))
  await act(() => result.current.toggle({ ...ACHIEVEMENT, id: '1' }))
  expect(result.current.pinned.has('1')).toBe(false)
  expect(global.fetch).toHaveBeenLastCalledWith(`/api/favorites?xboxAchievementId=1&gameId=${GAME}`, { method: 'DELETE' })
})

test('rolls back, and says so, when the pin request fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const { result } = renderHook(() => useXboxFavoriteAchievements(GAME, 'Halo'))
  await waitFor(() => expect(result.current.pinned.has('1')).toBe(true))
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({}, false))
  await act(() => result.current.toggle(ACHIEVEMENT))
  expect(result.current.pinned.has('3')).toBe(false)
  expect(result.current.error).not.toBeNull()
  expect(notify.error).toHaveBeenCalled()
})

test("pinning is not offered on someone else's page", () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { id: '1' } }, status: 'authenticated' })
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })) as unknown as typeof fetch
  const wrapper = ({ children }: { children: ReactNode }) => createElement(SubjectContext.Provider, { value: 'ivan' }, children)
  const { result } = renderHook(() => useXboxFavoriteAchievements(GAME, 'Halo'), { wrapper })
  expect(result.current.canPin).toBe(false)
})
