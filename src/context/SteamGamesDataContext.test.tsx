import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { SteamGamesDataProvider, useSteamGamesData } from './SteamGamesDataContext'

const RECENT = [{ _source: 'steam', id: 1, title: 'Recent' }]
const LIBRARY = [{ _source: 'steam', id: 2, title: 'Owned' }]

function setSteamId(steamid: string | null) {
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { id: '7', ...(steamid ? { steamid } : {}) } },
    status: 'authenticated',
    update: jest.fn(),
  })
}

function ok(body: unknown) {
  return { ok: true, json: async () => body }
}

function mockRoutes(recent: unknown = ok(RECENT), library: unknown = ok(LIBRARY)) {
  ;(global.fetch as jest.Mock).mockImplementation(async (url: string) => {
    if (url === '/api/steam/recentlyPlayed') {
      if (recent instanceof Error) throw recent
      return recent
    }
    if (url === '/api/steam/ownedGames') {
      if (library instanceof Error) throw library
      return library
    }
    throw new Error(`unexpected ${url}`)
  })
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <SteamGamesDataProvider>{children}</SteamGamesDataProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('outside a provider it reports an empty, unlinked state', () => {
  const { result } = renderHook(() => useSteamGamesData())
  expect(result.current.isLinked).toBe(false)
  expect(result.current.recent).toEqual([])
  expect(() => result.current.refetch()).not.toThrow()
})

test('does nothing for a user without Steam linked', () => {
  setSteamId(null)
  const { result } = renderHook(() => useSteamGamesData(), { wrapper })

  expect(result.current.isLinked).toBe(false)
  expect(fetch).not.toHaveBeenCalled()
})

test('loads the recent feed, then the library', async () => {
  setSteamId('765')
  mockRoutes()
  const { result } = renderHook(() => useSteamGamesData(), { wrapper })

  await waitFor(() => expect(result.current.libraryLoading).toBe(false))
  expect(result.current.isLinked).toBe(true)
  expect(result.current.recent).toEqual(RECENT)
  expect(result.current.library).toEqual(LIBRARY)
  expect((fetch as jest.Mock).mock.calls.map((c) => c[0])).toEqual([
    '/api/steam/recentlyPlayed',
    '/api/steam/ownedGames',
  ])
})

test('surfaces a failed recent feed and still loads the library', async () => {
  setSteamId('765')
  mockRoutes({ ok: false, status: 503 })
  const { result } = renderHook(() => useSteamGamesData(), { wrapper })

  await waitFor(() => expect(result.current.libraryLoading).toBe(false))
  expect(result.current.recentError).toMatch('503')
  expect(result.current.library).toEqual(LIBRARY)
})

test('surfaces a failed library', async () => {
  setSteamId('765')
  mockRoutes(ok(RECENT), new Error('offline'))
  const { result } = renderHook(() => useSteamGamesData(), { wrapper })

  await waitFor(() => expect(result.current.libraryError).toBe('offline'))
  expect(result.current.recent).toEqual(RECENT)
})

test('rejects a non-array payload', async () => {
  setSteamId('765')
  mockRoutes(ok({ message: 'nope' }), ok(LIBRARY))
  const { result } = renderHook(() => useSteamGamesData(), { wrapper })

  await waitFor(() => expect(result.current.recentError).toBe('Unexpected Steam response'))
})

test('reports a thrown non-Error generically', async () => {
  setSteamId('765')
  ;(global.fetch as jest.Mock).mockRejectedValue('weird')
  const { result } = renderHook(() => useSteamGamesData(), { wrapper })

  await waitFor(() => expect(result.current.libraryLoading).toBe(false))
  expect(result.current.recentError).toBe('Unknown error')
  expect(result.current.libraryError).toBe('Unknown error')
})

test('does not refetch on re-render for the same account', async () => {
  setSteamId('765')
  mockRoutes()
  const { result, rerender } = renderHook(() => useSteamGamesData(), { wrapper })
  await waitFor(() => expect(result.current.libraryLoading).toBe(false))

  rerender()
  expect(fetch).toHaveBeenCalledTimes(2)
})

test('refetch reloads both lists', async () => {
  setSteamId('765')
  mockRoutes()
  const { result } = renderHook(() => useSteamGamesData(), { wrapper })
  await waitFor(() => expect(result.current.libraryLoading).toBe(false))

  await act(async () => { result.current.refetch() })
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4))
})

test('clears everything on unlink', async () => {
  setSteamId('765')
  mockRoutes()
  const { result, rerender } = renderHook(() => useSteamGamesData(), { wrapper })
  await waitFor(() => expect(result.current.library).toEqual(LIBRARY))

  setSteamId(null)
  rerender()

  expect(result.current.isLinked).toBe(false)
  expect(result.current.recent).toEqual([])
  expect(result.current.library).toEqual([])
})

test('refetch is a no-op while unlinked', () => {
  setSteamId(null)
  const { result } = renderHook(() => useSteamGamesData(), { wrapper })
  act(() => result.current.refetch())
  expect(fetch).not.toHaveBeenCalled()
})

test('drops a response that arrives after the account changed', async () => {
  setSteamId('765')
  let releaseOld!: (v: unknown) => void
  ;(global.fetch as jest.Mock)
    .mockImplementationOnce(() => new Promise((r) => { releaseOld = r }))
    .mockImplementation(async (url: string) =>
      ok(url.includes('recently') ? [{ id: 99, title: 'New account' }] : []),
    )

  const { result, rerender } = renderHook(() => useSteamGamesData(), { wrapper })

  setSteamId('999')
  rerender()
  await waitFor(() => expect(result.current.recent).toEqual([{ id: 99, title: 'New account' }]))

  // The first account's recent feed finally lands — it must not overwrite.
  await act(async () => { releaseOld(ok([{ id: 1, title: 'Old account' }])) })
  expect(result.current.recent).toEqual([{ id: 99, title: 'New account' }])
})
