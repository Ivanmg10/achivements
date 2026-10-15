jest.mock('@/utils/adminFetch', () => ({ adminFetch: jest.fn() }))

import { renderHook, act } from '@testing-library/react'
import { useAdminXboxAchievements } from './useAdminXboxAchievements'
import { adminFetch } from '@/utils/adminFetch'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'

const XUID = '2535400000000001'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('nothing is asked until load()', () => {
  const { result } = renderHook(() => useAdminXboxAchievements(XUID, { titleId: '1', is360: false }))
  expect(adminFetch).not.toHaveBeenCalled()
  expect(result.current.achievements).toBeNull()
})

test('loads a modern game by xuid and title', async () => {
  const achievements = [xboxAchievementFixture()]
  ;(adminFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ achievements }) })
  const { result } = renderHook(() => useAdminXboxAchievements(XUID, { titleId: '1738914043', is360: false }))
  await act(async () => result.current.load())
  expect(adminFetch).toHaveBeenCalledWith(`/api/admin/xbox/achievements?xuid=${XUID}&titleId=1738914043`)
  expect(result.current.achievements).toEqual(achievements)
  expect(result.current.error).toBe(false)
})

test('an Xbox 360 game says so', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ achievements: [] }) })
  const { result } = renderHook(() => useAdminXboxAchievements(XUID, { titleId: '1096157159', is360: true }))
  await act(async () => result.current.load())
  expect(adminFetch).toHaveBeenCalledWith(`/api/admin/xbox/achievements?xuid=${XUID}&titleId=1096157159&is360=1`)
})

test('a failed answer sets the error, and a retry can recover', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) })
  const { result } = renderHook(() => useAdminXboxAchievements(XUID, { titleId: '1', is360: false }))
  await act(async () => result.current.load())
  expect(result.current.error).toBe(true)
  expect(result.current.achievements).toBeNull()
  ;(adminFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ achievements: [] }) })
  await act(async () => result.current.load())
  expect(result.current.error).toBe(false)
  expect(result.current.achievements).toEqual([])
})

test('a network failure sets the error too', async () => {
  ;(adminFetch as jest.Mock).mockRejectedValue(new Error('offline'))
  const { result } = renderHook(() => useAdminXboxAchievements(XUID, { titleId: '1', is360: false }))
  await act(async () => result.current.load())
  expect(result.current.error).toBe(true)
  expect(result.current.loading).toBe(false)
})
