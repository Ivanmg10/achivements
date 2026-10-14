import { renderHook, waitFor } from '@testing-library/react'
import { useFollowCounts } from './useFollowCounts'

beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}))

test('reads both counts', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ following: 4, followers: 2 }) })
  const { result } = renderHook(() => useFollowCounts())
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.counts).toEqual({ following: 4, followers: 2 }))
  expect(result.current.error).toBe(false)
})

test('a failure or an odd answer is an error, not zeros', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 })
  const { result } = renderHook(() => useFollowCounts())
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.counts).toBeNull()

  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ following: 'x' }) })
  const odd = renderHook(() => useFollowCounts())
  await waitFor(() => expect(odd.result.current.error).toBe(true))
})
