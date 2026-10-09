import { renderHook, waitFor, act } from '@testing-library/react'
import { usePsnTrophies } from './usePsnTrophies'

const TROPHIES = [{ id: 0 }]
const GROUPS = [{ id: 'default' }]

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ trophies: TROPHIES, groups: GROUPS }) })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('loads nothing without a game', () => {
  const { result } = renderHook(() => usePsnTrophies(null))
  expect(result.current).toMatchObject({ trophies: [], isLoading: false })
  expect(global.fetch).not.toHaveBeenCalled()
})

test("loads the game's trophies once, loading from the first render", async () => {
  const { result, rerender } = renderHook(() => usePsnTrophies('NPWR00001_00'))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.trophies).toEqual(TROPHIES))
  expect(result.current.groups).toEqual(GROUPS)
  rerender()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/trophies?id=NPWR00001_00&lang=en')
})

test('keeps the reason a load failed, and can retry', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'private' }) })
  const { result } = renderHook(() => usePsnTrophies('NPWR00001_00'))
  await waitFor(() => expect(result.current.error).toBe('private'))
  await act(() => result.current.retry())
  expect(result.current.error).toBeNull()
  expect(result.current.trophies).toEqual(TROPHIES)
})

test('a network failure is "failed"', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  const { result } = renderHook(() => usePsnTrophies('NPWR00001_00'))
  await waitFor(() => expect(result.current.error).toBe('failed'))
})

test('an answer without trophies is a failure', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
  const { result } = renderHook(() => usePsnTrophies('NPWR00001_00'))
  await waitFor(() => expect(result.current.error).toBe('failed'))
})
