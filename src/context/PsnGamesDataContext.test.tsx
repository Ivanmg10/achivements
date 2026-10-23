import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { PsnGamesDataProvider, usePsnGamesData } from './PsnGamesDataContext'

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })
}

const wrapper = ({ children }: { children: React.ReactNode }) => <PsnGamesDataProvider>{children}</PsnGamesDataProvider>
const GAMES = [{ id: 100, title: 'Astro Bot' }]

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => GAMES })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('without PSN linked: not linked, nothing loaded', () => {
  setSession({ id: '7' })
  const { result } = renderHook(() => usePsnGamesData(), { wrapper })
  expect(result.current).toMatchObject({ isLinked: false, library: [], libraryLoading: false, libraryError: null })
  expect(global.fetch).not.toHaveBeenCalled()
})

test('loads the trophy list once, loading from the first render', async () => {
  setSession({ id: '7', psnaccountid: '42' })
  const { result, rerender } = renderHook(() => usePsnGamesData(), { wrapper })
  expect(result.current.libraryLoading).toBe(true)
  await waitFor(() => expect(result.current.library).toEqual(GAMES))
  rerender()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/titles', { cache: 'no-store' })
})

test('keeps the reason it failed, and loads again on refetch', async () => {
  setSession({ id: '7', psnaccountid: '42' })
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'private' }) })
  const { result } = renderHook(() => usePsnGamesData(), { wrapper })
  await waitFor(() => expect(result.current.libraryError).toBe('private'))
  await act(async () => result.current.refetch())
  await waitFor(() => expect(result.current.library).toEqual(GAMES))
  expect(result.current.libraryError).toBeNull()
})

test('an unexpected answer is "failed"', async () => {
  setSession({ id: '7', psnaccountid: '42' })
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
  const { result } = renderHook(() => usePsnGamesData(), { wrapper })
  await waitFor(() => expect(result.current.libraryError).toBe('failed'))
})

test('with "platinum completes" on, only games with a platinum are flagged', async () => {
  window.localStorage.setItem('psn-completion', 'platinum')
  setSession({ id: '7', psnaccountid: '42' })
  const games = [
    { id: 1, earned: { platinum: 1 } },
    { id: 2, earned: { platinum: 0 } },
  ]
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => games })
  const { result } = renderHook(() => usePsnGamesData(), { wrapper })
  await waitFor(() => expect(result.current.library).toHaveLength(2))
  expect(result.current.library.map((g) => g.platinumCompletes)).toEqual([true, undefined])
  window.localStorage.clear()
})

describe('the consoles unticked in preferences', () => {
  const MIXED = [
    { id: 1, title: 'Old', consoleName: 'PS3', earned: { platinum: 0 } },
    { id: 2, title: 'Both', consoleName: 'PS4 · PS5', earned: { platinum: 0 } },
  ]

  beforeEach(() => {
    window.localStorage.clear()
    setSession({ id: '7', psnaccountid: '42' })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => MIXED })
  })

  test('leave the list, but not the full one, and the options count every game', async () => {
    window.localStorage.setItem('hidden-consoles:psn', '["PS3","PS4"]')
    const { result } = renderHook(() => usePsnGamesData(), { wrapper })
    await waitFor(() => expect(result.current.fullLibrary).toHaveLength(2))
    expect(result.current.library.map((g) => g.id)).toEqual([2])
    expect(result.current.consoles.map((c) => c.name).sort()).toEqual(['PS Vita', 'PS3', 'PS4', 'PS5'])
  })
})
