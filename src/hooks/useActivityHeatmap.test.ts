import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useActivityHeatmap } from './useActivityHeatmap'

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
  const { result } = renderHook(() => useActivityHeatmap())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).not.toHaveBeenCalled()
  expect(result.current.achievements).toEqual([])
})

test('loads once from /api/getActivityHeatmap', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([{ Date: '2024-01-01 10:00:00' }])
  const { result, rerender } = renderHook(() => useActivityHeatmap())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  rerender()
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getActivityHeatmap')
  expect(result.current.achievements).toEqual([{ Date: '2024-01-01 10:00:00' }])
  expect(result.current.error).toBe(false)
})

test('an answer of the wrong shape is a failure, not data', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ nope: true })
  const { result } = renderHook(() => useActivityHeatmap())
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.achievements).toEqual([])
})

test('a failure is retried before it is shown', async () => {
  ;(fetchWithRetry as jest.Mock).mockRejectedValueOnce(new Error('down')).mockResolvedValue([{ Date: '2024-01-01 10:00:00' }])
  ;(scheduleRetry as jest.Mock).mockImplementationOnce((_a: unknown, _t: unknown, retry: () => void) => {
    retry()
    return true
  })
  const { result } = renderHook(() => useActivityHeatmap())
  await waitFor(() => expect(result.current.achievements).toEqual([{ Date: '2024-01-01 10:00:00' }]))
  expect(fetchWithRetry).toHaveBeenCalledTimes(2)
  expect(result.current.error).toBe(false)
})

test('out of retries, the error shows; refetch tries again', async () => {
  ;(fetchWithRetry as jest.Mock).mockRejectedValueOnce(new Error('down')).mockResolvedValue([{ Date: '2024-01-01 10:00:00' }])
  const { result } = renderHook(() => useActivityHeatmap())
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.refetch())
  await waitFor(() => expect(result.current.achievements).toEqual([{ Date: '2024-01-01 10:00:00' }]))
  expect(result.current.error).toBe(false)
})
