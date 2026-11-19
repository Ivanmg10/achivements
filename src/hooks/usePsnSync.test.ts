jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

import { act, renderHook, waitFor } from '@testing-library/react'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'
import { usePsnSync } from './usePsnSync'

/** jsdom has no Response: the parts the hook reads. */
const answer = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, headers: { get: (k: string) => headers[k] ?? null }, json: async () => body })
const stage = (s: string) => ({ stage: s, trouble: null })
let fetchMock: jest.Mock

beforeEach(() => {
  jest.useFakeTimers()
  fetchMock = jest.fn()
  global.fetch = fetchMock
  jest.clearAllMocks()
})
afterEach(() => jest.useRealTimers())

const tick = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

test('a first sync is read again while it runs and announced when the core lands and when it ends', async () => {
  fetchMock.mockReturnValueOnce(answer(stage('syncing_core'))).mockReturnValueOnce(answer(stage('ready_partial'))).mockReturnValueOnce(answer(stage('ready')))
  const onSynced = jest.fn()
  const { result } = renderHook(() => usePsnSync(true, onSynced))
  await waitFor(() => expect(result.current.sync?.stage).toBe('syncing_core'))
  await tick(4_000)
  await waitFor(() => expect(result.current.sync?.stage).toBe('ready_partial'))
  expect(notify.success).toHaveBeenCalledWith(en.toast.psnCoreReady)
  await tick(15_000)
  await waitFor(() => expect(result.current.sync?.stage).toBe('ready'))
  expect(notify.success).toHaveBeenLastCalledWith(en.toast.psnSynced)
  // The page's reads waited out the 202 themselves: nothing to refetch. And no more reads once done.
  expect(onSynced).not.toHaveBeenCalled()
  await tick(60_000)
  expect(fetchMock).toHaveBeenCalledTimes(3)
})

test('a routine sync stays quiet; a refresh the user asked for refetches and says so when done', async () => {
  fetchMock.mockReturnValueOnce(answer(stage('ready')))
  const onSynced = jest.fn()
  const { result } = renderHook(() => usePsnSync(true, onSynced))
  await waitFor(() => expect(result.current.sync?.stage).toBe('ready'))
  fetchMock.mockReturnValueOnce(answer({ status: 'queued' }, 202)).mockReturnValueOnce(answer(stage('ready')))
  await act(() => result.current.refresh())
  await waitFor(() => expect(onSynced).toHaveBeenCalledTimes(1))
  expect(notify.success).toHaveBeenCalledWith(en.toast.psnSynced)
  expect(fetchMock.mock.calls[1]).toEqual(['/api/psn/refresh', { method: 'POST' }])
})

test('a refresh too soon or already running is said in words; another failure is thrown for the button', async () => {
  fetchMock.mockReturnValueOnce(answer(stage('ready')))
  const { result } = renderHook(() => usePsnSync(true, jest.fn()))
  await waitFor(() => expect(result.current.sync).not.toBeNull())
  fetchMock.mockReturnValueOnce(answer({ error: 'too-soon' }, 429, { 'Retry-After': '500' }))
  await act(() => result.current.refresh())
  expect(notify.success).toHaveBeenCalledWith('You can update again in 9 min')
  fetchMock.mockReturnValueOnce(answer({ error: 'syncing' }, 409))
  await act(() => result.current.refresh())
  expect(notify.success).toHaveBeenCalledWith(en.toast.psnAlreadySyncing)
  fetchMock.mockReturnValueOnce(answer({ error: 'failed' }, 500))
  await expect(result.current.refresh()).rejects.toThrow('refresh 500')
})

test('a failed status read is kept quiet on screen and tried again; off reads nothing', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  fetchMock.mockReturnValueOnce(answer({ error: 'failed' }, 500)).mockReturnValueOnce(answer(stage('ready')))
  const { result } = renderHook(() => usePsnSync(true, jest.fn()))
  await waitFor(() => expect(result.current.error).toBe(true))
  await tick(15_000)
  await waitFor(() => expect(result.current.sync?.stage).toBe('ready'))
  expect(result.current.error).toBe(false)
  ;(console.error as jest.Mock).mockRestore()
  fetchMock.mockClear()
  renderHook(() => usePsnSync(false, jest.fn()))
  expect(fetchMock).not.toHaveBeenCalled()
})
