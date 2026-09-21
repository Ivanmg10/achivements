import { renderHook, waitFor, act } from '@testing-library/react'
import { useSteamAchievements } from './useSteamAchievements'

const ACH = [{ _source: 'steam', id: 'A', title: 'Win' }]

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('does nothing until a game is selected', () => {
  const { result } = renderHook(() => useSteamAchievements(null))
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current).toMatchObject({ achievements: [], isLoading: false, error: null })
  expect(() => result.current.retry()).not.toThrow()
})

test('loads the selected game', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ACH })
  const { result } = renderHook(() => useSteamAchievements(730))

  await waitFor(() => expect(result.current.achievements).toEqual(ACH))
  expect(fetch).toHaveBeenCalledWith('/api/steam/achievements?appid=730')
  expect(result.current.isLoading).toBe(false)
})

test('reuses a loaded game instead of refetching', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ACH })
  const { result, rerender } = renderHook(({ id }) => useSteamAchievements(id), {
    initialProps: { id: 730 as number | null },
  })
  await waitFor(() => expect(result.current.achievements).toEqual(ACH))

  rerender({ id: null })
  rerender({ id: 730 })
  expect(result.current.achievements).toEqual(ACH)
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('surfaces an HTTP error and does not loop on it', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 })
  const { result } = renderHook(() => useSteamAchievements(730))

  await waitFor(() => expect(result.current.error).toMatch('503'))
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('rejects a non-array payload', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ message: 'x' }) })
  const { result } = renderHook(() => useSteamAchievements(730))
  await waitFor(() => expect(result.current.error).toBe('Unexpected achievements response'))
})

test('surfaces a non-Error rejection generically', async () => {
  ;(fetch as jest.Mock).mockRejectedValue('weird')
  const { result } = renderHook(() => useSteamAchievements(730))
  await waitFor(() => expect(result.current.error).toBe('Unknown error'))
})

test('retry clears the error and loads again', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, json: async () => ACH })
  const { result } = renderHook(() => useSteamAchievements(730))
  await waitFor(() => expect(result.current.error).not.toBeNull())

  await act(async () => { result.current.retry() })
  await waitFor(() => expect(result.current.achievements).toEqual(ACH))
  expect(result.current.error).toBeNull()
})

test('ignores a duplicate retry while a load is in flight', async () => {
  let release!: (v: unknown) => void
  ;(fetch as jest.Mock).mockImplementation(() => new Promise((r) => { release = r }))
  const { result } = renderHook(() => useSteamAchievements(730))

  act(() => { result.current.retry() })
  expect(fetch).toHaveBeenCalledTimes(1)
  await act(async () => { release({ ok: true, json: async () => ACH }) })
})

test('a slow earlier game does not clear the loading flag of the current one', async () => {
  const releases: Record<number, (v: unknown) => void> = {}
  ;(fetch as jest.Mock).mockImplementation((url: string) => {
    const id = Number(url.split('=')[1])
    return new Promise((r) => { releases[id] = r })
  })

  const { result, rerender } = renderHook(({ id }) => useSteamAchievements(id), {
    initialProps: { id: 1 as number | null },
  })
  rerender({ id: 2 })
  expect(result.current.isLoading).toBe(true)

  await act(async () => { releases[1]({ ok: true, json: async () => ACH }) })
  expect(result.current.isLoading).toBe(true)

  await act(async () => { releases[2]({ ok: true, json: async () => ACH }) })
  expect(result.current.isLoading).toBe(false)
})
