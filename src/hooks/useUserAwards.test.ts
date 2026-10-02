import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useUserAwards } from './useUserAwards'

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
  const { result } = renderHook(() => useUserAwards())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).not.toHaveBeenCalled()
  expect(result.current.awards).toEqual(null)
})

test('loads once from /api/getUserAwards', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ TotalAwardsCount: 2, VisibleUserAwards: [] })
  const { result, rerender } = renderHook(() => useUserAwards())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  rerender()
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getUserAwards')
  expect(result.current.awards).toEqual({ TotalAwardsCount: 2, VisibleUserAwards: [] })
  expect(result.current.error).toBe(false)
})

test('an answer of the wrong shape is a failure, not data', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([])
  const { result } = renderHook(() => useUserAwards())
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.awards).toEqual(null)
})

test('a failure is retried before it is shown', async () => {
  ;(fetchWithRetry as jest.Mock).mockRejectedValueOnce(new Error('down')).mockResolvedValue({ TotalAwardsCount: 2, VisibleUserAwards: [] })
  ;(scheduleRetry as jest.Mock).mockImplementationOnce((_a: unknown, _t: unknown, retry: () => void) => {
    retry()
    return true
  })
  const { result } = renderHook(() => useUserAwards())
  await waitFor(() => expect(result.current.awards).toEqual({ TotalAwardsCount: 2, VisibleUserAwards: [] }))
  expect(fetchWithRetry).toHaveBeenCalledTimes(2)
  expect(result.current.error).toBe(false)
})

test('out of retries, the error shows; refetch tries again', async () => {
  ;(fetchWithRetry as jest.Mock).mockRejectedValueOnce(new Error('down')).mockResolvedValue({ TotalAwardsCount: 2, VisibleUserAwards: [] })
  const { result } = renderHook(() => useUserAwards())
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.refetch())
  await waitFor(() => expect(result.current.awards).toEqual({ TotalAwardsCount: 2, VisibleUserAwards: [] }))
  expect(result.current.error).toBe(false)
})
