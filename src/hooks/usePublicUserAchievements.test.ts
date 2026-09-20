global.fetch = jest.fn()

import { renderHook, waitFor } from '@testing-library/react'
import { usePublicUserAchievements } from './usePublicUserAchievements'

beforeEach(() => {
  ;(fetch as jest.Mock).mockReset()
})

test('fetches achievements for the given username', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve([{ AchievementID: 1 }]) })
  const { result } = renderHook(() => usePublicUserAchievements('alice'))

  await waitFor(() => expect(result.current.achievements).toHaveLength(1))
})

test('refetches and clears stale data when the username changes', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ AchievementID: 1 }]) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ AchievementID: 2 }, { AchievementID: 3 }]) })

  const { result, rerender } = renderHook(({ u }) => usePublicUserAchievements(u), { initialProps: { u: 'alice' } })
  await waitFor(() => expect(result.current.achievements).toHaveLength(1))

  rerender({ u: 'bob' })
  expect(result.current.achievements).toHaveLength(0)
  await waitFor(() => expect(result.current.achievements).toHaveLength(2))
  expect(fetch).toHaveBeenCalledTimes(2)
})

test('does not refetch on a re-render with the same username', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
  const { rerender } = renderHook(({ u }) => usePublicUserAchievements(u), { initialProps: { u: 'alice' } })
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

  rerender({ u: 'alice' })
  expect(fetch).toHaveBeenCalledTimes(1)
})
