global.fetch = jest.fn()

import { act, renderHook, waitFor } from '@testing-library/react'
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

test('a user RA does not know is "missing"; RA failing is "failed", and can be retried', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
  const { result: unknown } = renderHook(() => usePublicUserProfile('nobody'))
  await waitFor(() => expect(unknown.current.error).toBe('missing'))

  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 502 })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ User: 'alice' }) })
  const { result } = renderHook(() => usePublicUserProfile('alice'))
  await waitFor(() => expect(result.current.error).toBe('failed'))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.profile?.User).toBe('alice'))
  expect(result.current.error).toBeNull()
})
