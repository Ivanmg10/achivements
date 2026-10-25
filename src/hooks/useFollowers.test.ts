import { act, renderHook, waitFor } from '@testing-library/react'
import { useFollowers } from './useFollowers'

beforeEach(() => {
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('asks for your followers once enabled, and only then', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [{ username: 'fan' }] })
  const { result, rerender } = renderHook(({ on }) => useFollowers(on), { initialProps: { on: false } })
  expect(global.fetch).not.toHaveBeenCalled()
  expect(result.current.isLoading).toBe(false)
  rerender({ on: true })
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.followers).toEqual([{ username: 'fan' }]))
  expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/follows/overview?who=followers')
})

test('a failure is an error until retried', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce({ ok: true, json: async () => [] })
  const { result } = renderHook(() => useFollowers(true))
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.followers).toEqual([]))
  expect(result.current.error).toBe(false)
})

test('like the people you follow, the newest fans get their activity and games read', async () => {
  ;(global.fetch as jest.Mock).mockImplementation((url: string) =>
    Promise.resolve({ ok: true, json: async () => (url.startsWith('/api/follows/overview') ? [{ username: 'fan', ra: true }] : []) }),
  )
  const { result } = renderHook(() => useFollowers(true))
  await waitFor(() => expect(result.current.details.fan).toBeDefined())
  expect(result.current.details.fan).toMatchObject({ recent: [], games: [], lastPlayed: null })
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/getRecentAchievements?user=fan'), expect.anything())
})
