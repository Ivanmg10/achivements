import { renderHook, waitFor, act } from '@testing-library/react'
import { useXboxAchievements } from './useXboxAchievements'

const ACHIEVEMENTS = [{ id: '1' }]

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ achievements: ACHIEVEMENTS }) })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('loads nothing without a game', () => {
  const { result } = renderHook(() => useXboxAchievements(null))
  expect(result.current).toMatchObject({ achievements: [], isLoading: false })
  expect(global.fetch).not.toHaveBeenCalled()
})

test("loads the game's achievements once, loading from the first render", async () => {
  const { result, rerender } = renderHook(() => useXboxAchievements('1738914043'))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.achievements).toEqual(ACHIEVEMENTS))
  rerender()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith('/api/xbox/achievements?id=1738914043&lang=en')
})

test('keeps the reason a load failed, and can retry', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'private' }) })
  const { result } = renderHook(() => useXboxAchievements('1738914043'))
  await waitFor(() => expect(result.current.error).toBe('private'))
  await act(() => result.current.retry())
  expect(result.current.error).toBeNull()
  expect(result.current.achievements).toEqual(ACHIEVEMENTS)
})

test('a network failure is "failed"', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  const { result } = renderHook(() => useXboxAchievements('1738914043'))
  await waitFor(() => expect(result.current.error).toBe('failed'))
})

test('an answer without achievements is a failure', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
  const { result } = renderHook(() => useXboxAchievements('1738914043'))
  await waitFor(() => expect(result.current.error).toBe('failed'))
})
