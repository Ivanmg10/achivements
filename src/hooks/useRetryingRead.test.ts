import { act, renderHook, waitFor } from '@testing-library/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { forgetAnswers, keepAnswer, lastAnswer } from '@/lib/lastAnswers'
import { useRetryingRead } from './useRetryingRead'

jest.mock('@/lib/fetchWithRetry', () => ({
  ...jest.requireActual('@/lib/fetchWithRetry'),
  fetchWithRetry: jest.fn(),
}))

const read = fetchWithRetry as jest.Mock
const asList = (data: unknown) => (Array.isArray(data) ? (data as number[]) : null)
const status = (code: number) => Object.assign(new Error(`HTTP ${code}`), { status: code })

beforeEach(() => {
  jest.clearAllMocks()
  forgetAnswers()
})
afterEach(() => jest.useRealTimers())

test('loads, then stops loading', async () => {
  read.mockResolvedValue([1, 2])
  const { result } = renderHook(() => useRetryingRead('/api/x', { parse: asList }))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.data).toEqual([1, 2]))
  expect(result.current.isLoading).toBe(false)
  expect(result.current.error).toBe(false)
  expect(read).toHaveBeenCalledWith('/api/x')
})

test('no URL asks for nothing and is not loading', () => {
  const { result } = renderHook(() => useRetryingRead(null, { parse: asList }))
  expect(read).not.toHaveBeenCalled()
  expect(result.current).toMatchObject({ data: null, isLoading: false, error: false })
})

test('a 4xx ends the read at once, with its status', async () => {
  read.mockRejectedValue(status(403))
  const { result } = renderHook(() => useRetryingRead('/api/x', { parse: asList }))
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.errorStatus).toBe(403)
  expect(read).toHaveBeenCalledTimes(1)
})

test('a failure or an answer of the wrong shape is retried in the background', async () => {
  jest.useFakeTimers()
  read.mockResolvedValueOnce({ not: 'a list' }).mockRejectedValueOnce(new Error('down')).mockResolvedValue([3])
  const { result } = renderHook(() => useRetryingRead('/api/x', { parse: asList }))
  await act(async () => {
    await jest.advanceTimersByTimeAsync(3_000)
  })
  await act(async () => {
    await jest.advanceTimersByTimeAsync(6_000)
  })
  expect(result.current.data).toEqual([3])
  expect(result.current.error).toBe(false)
  expect(read).toHaveBeenCalledTimes(3)
})

test('gives up after the background retries and says so', async () => {
  jest.useFakeTimers()
  read.mockRejectedValue(new Error('down'))
  const { result } = renderHook(() => useRetryingRead('/api/x', { parse: asList }))
  await act(async () => {
    await jest.advanceTimersByTimeAsync(200_000)
  })
  expect(result.current.error).toBe(true)
  expect(result.current.errorStatus).toBeUndefined()
  expect(read).toHaveBeenCalledTimes(6)
})

test('refetch starts over: no data, no error, a new read', async () => {
  read.mockRejectedValueOnce(status(400)).mockResolvedValue([4])
  const { result } = renderHook(() => useRetryingRead('/api/x', { parse: asList }))
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.refetch())
  expect(result.current).toMatchObject({ data: null, isLoading: true, error: false })
  await waitFor(() => expect(result.current.data).toEqual([4]))
})

test('the last answer paints at once while it is read again, and the new one is kept', async () => {
  keepAnswer('u1', '/api/x', [9])
  read.mockResolvedValue([10])
  const { result } = renderHook(() => useRetryingRead('/api/x', { parse: asList, keepFor: 'u1' }))
  expect(result.current).toMatchObject({ data: [9], isLoading: false })
  await waitFor(() => expect(result.current.data).toEqual([10]))
  expect(lastAnswer('u1', '/api/x')).toEqual([10])
})

test('another URL drops the old data and the old read; no URL clears it', async () => {
  let answerOld: (v: unknown) => void = () => {}
  read.mockImplementationOnce(() => new Promise((resolve) => { answerOld = resolve })).mockResolvedValue([2])
  const { result, rerender } = renderHook(({ url }) => useRetryingRead(url, { parse: asList }), {
    initialProps: { url: '/api/a' as string | null },
  })
  rerender({ url: '/api/b' })
  await waitFor(() => expect(result.current.data).toEqual([2]))
  await act(async () => answerOld([1]))
  expect(result.current.data).toEqual([2])
  rerender({ url: null })
  expect(result.current).toMatchObject({ data: null, isLoading: false })
})

test('passes the attempts per round on', async () => {
  read.mockResolvedValue([1])
  renderHook(() => useRetryingRead('/api/x', { parse: asList, attempts: 1 }))
  await waitFor(() => expect(read).toHaveBeenCalledWith('/api/x', 1))
})
