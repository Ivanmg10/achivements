import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useUserRank } from './useUserRank'

jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn(), scheduleRetry: jest.fn() }))

const signedIn = (rausername: string | null = 'ivan') =>
  (useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { rausername } } })

beforeEach(() => {
  jest.clearAllMocks()
  signedIn()
  // Out of retries: a failure is final.
  ;(scheduleRetry as jest.Mock).mockReturnValue(false)
})

test('without an RA account there is nothing to load', async () => {
  signedIn(null)
  const { result } = renderHook(() => useUserRank())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).not.toHaveBeenCalled()
  expect(result.current.rank).toEqual(null)
})

test('loads once from /api/getUserRankAndScore', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ Rank: 7, Score: 100, SoftcoreScore: 0 })
  const { result, rerender } = renderHook(() => useUserRank())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  rerender()
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getUserRankAndScore')
  expect(result.current.rank).toEqual({ Rank: 7, Score: 100, SoftcoreScore: 0 })
  expect(result.current.error).toBe(false)
})

test('an answer of the wrong shape is a failure, not data', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ Score: 1 })
  const { result } = renderHook(() => useUserRank())
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.rank).toEqual(null)
})

test('a failure is retried before it is shown', async () => {
  ;(fetchWithRetry as jest.Mock).mockRejectedValueOnce(new Error('down')).mockResolvedValue({ Rank: 7, Score: 100, SoftcoreScore: 0 })
  ;(scheduleRetry as jest.Mock).mockImplementationOnce((_a: unknown, _t: unknown, retry: () => void) => {
    retry()
    return true
  })
  const { result } = renderHook(() => useUserRank())
  await waitFor(() => expect(result.current.rank).toEqual({ Rank: 7, Score: 100, SoftcoreScore: 0 }))
  expect(fetchWithRetry).toHaveBeenCalledTimes(2)
  expect(result.current.error).toBe(false)
})

test('out of retries, the error shows; refetch tries again', async () => {
  ;(fetchWithRetry as jest.Mock).mockRejectedValueOnce(new Error('down')).mockResolvedValue({ Rank: 7, Score: 100, SoftcoreScore: 0 })
  const { result } = renderHook(() => useUserRank())
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.refetch())
  await waitFor(() => expect(result.current.rank).toEqual({ Rank: 7, Score: 100, SoftcoreScore: 0 }))
  expect(result.current.error).toBe(false)
})
