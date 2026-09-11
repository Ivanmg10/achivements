global.fetch = jest.fn()

import { renderHook, waitFor } from '@testing-library/react'
import { usePublicUserAwards } from './usePublicUserAwards'

beforeEach(() => {
  ;(fetch as jest.Mock).mockReset()
})

test('fetches awards for the given username', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ TotalAwardsCount: 5 }) })
  const { result } = renderHook(() => usePublicUserAwards('alice'))

  await waitFor(() => expect(result.current.awards?.TotalAwardsCount).toBe(5))
})

test('refetches and clears stale data when the username changes', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ TotalAwardsCount: 5 }) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ TotalAwardsCount: 9 }) })

  const { result, rerender } = renderHook(({ u }) => usePublicUserAwards(u), { initialProps: { u: 'alice' } })
  await waitFor(() => expect(result.current.awards?.TotalAwardsCount).toBe(5))

  rerender({ u: 'bob' })
  expect(result.current.awards).toBeNull()
  await waitFor(() => expect(result.current.awards?.TotalAwardsCount).toBe(9))
  expect(fetch).toHaveBeenCalledTimes(2)
})

test('does not refetch on a re-render with the same username', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ TotalAwardsCount: 5 }) })
  const { rerender } = renderHook(({ u }) => usePublicUserAwards(u), { initialProps: { u: 'alice' } })
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

  rerender({ u: 'alice' })
  expect(fetch).toHaveBeenCalledTimes(1)
})
