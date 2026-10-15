import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { XboxGamesDataProvider, useXboxGamesData } from './XboxGamesDataContext'

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })
}

const wrapper = ({ children }: { children: React.ReactNode }) => <XboxGamesDataProvider>{children}</XboxGamesDataProvider>
const GAMES = [{ id: 100, title: 'Halo' }]

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => GAMES })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('without Xbox linked: not linked, nothing loaded', () => {
  setSession({ id: '7', admin: true })
  const { result } = renderHook(() => useXboxGamesData(), { wrapper })
  expect(result.current).toMatchObject({ isLinked: false, library: [], libraryLoading: false, libraryError: null })
  expect(global.fetch).not.toHaveBeenCalled()
})

test('for a user who may not use Xbox it is not linked and asks for nothing, whatever the session holds', () => {
  setSession({ id: '7', xboxxuid: '25354' })
  const { result } = renderHook(() => useXboxGamesData(), { wrapper })
  expect(result.current.isLinked).toBe(false)
  expect(global.fetch).not.toHaveBeenCalled()
})

test('loads the library once, loading from the first render', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  const { result, rerender } = renderHook(() => useXboxGamesData(), { wrapper })
  expect(result.current.libraryLoading).toBe(true)
  await waitFor(() => expect(result.current.library).toEqual(GAMES))
  rerender()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith('/api/xbox/titles', { cache: 'no-store' })
})

test('keeps the reason it failed, and loads again on refetch', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: 'rate-limited' }) })
  const { result } = renderHook(() => useXboxGamesData(), { wrapper })
  await waitFor(() => expect(result.current.libraryError).toBe('rate-limited'))
  await act(async () => result.current.refetch())
  await waitFor(() => expect(result.current.library).toEqual(GAMES))
  expect(result.current.libraryError).toBeNull()
})

test('an unexpected answer, or a network failure, is "failed"', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
  const first = renderHook(() => useXboxGamesData(), { wrapper })
  await waitFor(() => expect(first.result.current.libraryError).toBe('failed'))
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  const second = renderHook(() => useXboxGamesData(), { wrapper })
  await waitFor(() => expect(second.result.current.libraryError).toBe('failed'))
})

test('unlinking drops what the account left behind', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  const { result, rerender } = renderHook(() => useXboxGamesData(), { wrapper })
  await waitFor(() => expect(result.current.library).toEqual(GAMES))
  setSession({ id: '7', admin: true })
  rerender()
  expect(result.current).toMatchObject({ isLinked: false, library: [], libraryLoading: false })
})
