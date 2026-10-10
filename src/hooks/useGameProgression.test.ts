import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useGameProgression } from './useGameProgression'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))

const GAME = { ID: 7, Title: 'Sonic' }
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
const fail = (status: number) => ({ ok: false, status, json: async () => ({}) })
const session = (status: 'authenticated' | 'unauthenticated' | 'loading') =>
  (useSession as jest.Mock).mockReturnValue({ status, data: null })

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  global.fetch = jest.fn()
  session('authenticated')
})
afterEach(() => jest.useRealTimers())

test('loads the game and stops loading', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(ok(GAME))
  const { result } = renderHook(() => useGameProgression('7'))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.game).toEqual(GAME))
  expect(result.current.isLoading).toBe(false)
  expect(result.current.error).toBe(false)
  expect(fetch).toHaveBeenCalledWith('/api/getGameProgression?gameId=7')
})

test('asks for nothing without a game id, and is not loading', () => {
  const { result } = renderHook(() => useGameProgression(null))
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current.isLoading).toBe(false)
})

test('waits for the session before asking', () => {
  session('loading')
  const { result } = renderHook(() => useGameProgression('7'))
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current.isLoading).toBe(false)
})

test('another game is loading again until its answer arrives', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(ok(GAME))
  const { result, rerender } = renderHook(({ id }) => useGameProgression(id), { initialProps: { id: '7' } })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  ;(fetch as jest.Mock).mockResolvedValue(ok({ ID: 8 }))
  rerender({ id: '8' })
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.game).toEqual({ ID: 8 }))
  expect(result.current.isLoading).toBe(false)
})

test('a 4xx is not retried: the error shows at once', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(fail(404))
  const { result } = renderHook(() => useGameProgression('7'))
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.isLoading).toBe(false)
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('a failure is retried in the background before giving up', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce(fail(500)).mockResolvedValue(ok(GAME))
  const { result } = renderHook(() => useGameProgression('7'))
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  expect(result.current.isLoading).toBe(true)
  await act(async () => { await jest.advanceTimersByTimeAsync(3_000) })
  await waitFor(() => expect(result.current.game).toEqual(GAME))
  expect(result.current.error).toBe(false)
})

test('an answer without a game is a failure, not a game', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(ok({ message: 'nope' }))
  const { result } = renderHook(() => useGameProgression('7'))
  for (let i = 0; i < 6; i++) await act(async () => { await jest.advanceTimersByTimeAsync(30_000) })
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.game).toBeNull()
})

test('refetch asks again and shows loading meanwhile', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(ok(GAME))
  const { result } = renderHook(() => useGameProgression('7'))
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  act(() => result.current.refetch())
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetch).toHaveBeenCalledTimes(2)
})

test('signing out drops the game', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(ok(GAME))
  const { result, rerender } = renderHook(() => useGameProgression('7'))
  await waitFor(() => expect(result.current.game).toEqual(GAME))
  session('unauthenticated')
  rerender()
  expect(result.current.game).toBeNull()
  expect(result.current.isLoading).toBe(false)
})
