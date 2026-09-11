global.fetch = jest.fn()

import { renderHook, waitFor } from '@testing-library/react'
import { usePublicUserProfile } from './usePublicUserProfile'

beforeEach(() => {
  ;(fetch as jest.Mock).mockReset()
})

test('fetches the profile for the given username', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ User: 'alice' }) })
  const { result } = renderHook(() => usePublicUserProfile('alice'))

  await waitFor(() => expect(result.current.profile?.User).toBe('alice'))
  expect(fetch).toHaveBeenCalledWith('/api/public/user/profile?u=alice')
})

test('refetches and clears stale data when the username changes', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ User: 'alice' }) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ User: 'bob' }) })

  const { result, rerender } = renderHook(({ u }) => usePublicUserProfile(u), { initialProps: { u: 'alice' } })
  await waitFor(() => expect(result.current.profile?.User).toBe('alice'))

  rerender({ u: 'bob' })
  expect(result.current.profile).toBeNull()
  await waitFor(() => expect(result.current.profile?.User).toBe('bob'))
  expect(fetch).toHaveBeenCalledTimes(2)
})

test('does not refetch on a re-render with the same username', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ User: 'alice' }) })
  const { result, rerender } = renderHook(({ u }) => usePublicUserProfile(u), { initialProps: { u: 'alice' } })
  await waitFor(() => expect(result.current.profile?.User).toBe('alice'))

  rerender({ u: 'alice' })
  expect(fetch).toHaveBeenCalledTimes(1)
})
