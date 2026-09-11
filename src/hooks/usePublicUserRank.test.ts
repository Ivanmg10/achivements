global.fetch = jest.fn()

import { renderHook, waitFor } from '@testing-library/react'
import { usePublicUserRank } from './usePublicUserRank'

beforeEach(() => {
  ;(fetch as jest.Mock).mockReset()
})

test('fetches rank for the given username', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ Rank: 42 }) })
  const { result } = renderHook(() => usePublicUserRank('alice'))

  await waitFor(() => expect(result.current.rank?.Rank).toBe(42))
})

test('refetches and clears stale data when the username changes', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ Rank: 42 }) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ Rank: 7 }) })

  const { result, rerender } = renderHook(({ u }) => usePublicUserRank(u), { initialProps: { u: 'alice' } })
  await waitFor(() => expect(result.current.rank?.Rank).toBe(42))

  rerender({ u: 'bob' })
  expect(result.current.rank).toBeNull()
  await waitFor(() => expect(result.current.rank?.Rank).toBe(7))
  expect(fetch).toHaveBeenCalledTimes(2)
})

test('does not refetch on a re-render with the same username', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ Rank: 42 }) })
  const { rerender } = renderHook(({ u }) => usePublicUserRank(u), { initialProps: { u: 'alice' } })
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

  rerender({ u: 'alice' })
  expect(fetch).toHaveBeenCalledTimes(1)
})
