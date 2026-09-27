import { StrictMode } from 'react'
import { render, renderHook, waitFor, act } from '@testing-library/react'
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

describe('filling achievement counts in the background', () => {
  const unloaded = { _source: 'steam', id: 5, title: 'Pending', hasStats: true, playtimeForever: 60, achievementsLoaded: false }
  const loaded = { ...unloaded, achievementsLoaded: true, maxPossible: 10, numAwarded: 10 }

  function libraryResponses(...bodies: unknown[]) {
    const queue = [...bodies]
    ;(global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url === '/api/steam/recentlyPlayed') return ok(RECENT)
      const next = queue.length > 1 ? queue.shift() : queue[0]
      if (next instanceof Error) throw next
      return ok(next)
    })
  }

  const libraryCalls = () =>
    (fetch as jest.Mock).mock.calls.filter((c) => c[0] === '/api/steam/ownedGames').length

  test('keeps asking until every countable game has counts', async () => {
    setSteamId('765')
    libraryResponses([unloaded], [loaded])
    const { result } = renderHook(() => useSteamGamesData(), { wrapper })

    await waitFor(() => expect(result.current.library).toEqual([loaded]), { timeout: 3000 })
    expect(libraryCalls()).toBe(2)
  })

  test('shows the first partial result straight away rather than waiting for the fill', async () => {
    setSteamId('765')
    libraryResponses([unloaded], [loaded])
    const { result } = renderHook(() => useSteamGamesData(), { wrapper })

    await waitFor(() => expect(result.current.library).toEqual([unloaded]))
    expect(result.current.libraryLoading).toBe(false)
  })

  test('stops when a pass makes no progress, e.g. a private profile', async () => {
    setSteamId('765')
    libraryResponses([unloaded])
    const { result } = renderHook(() => useSteamGamesData(), { wrapper })

    await waitFor(() => expect(libraryCalls()).toBe(2), { timeout: 3000 })
    await new Promise((r) => setTimeout(r, 800))
    expect(libraryCalls()).toBe(2)
    expect(result.current.library).toEqual([unloaded])
  })

  test('a failed fill pass keeps what is shown and reports no error', async () => {
    setSteamId('765')
    libraryResponses([unloaded], new Error('offline'))
    const { result } = renderHook(() => useSteamGamesData(), { wrapper })

    await waitFor(() => expect(libraryCalls()).toBe(2), { timeout: 3000 })
    expect(result.current.library).toEqual([unloaded])
    expect(result.current.libraryError).toBeNull()
  })

  test('stops filling once the account is unlinked', async () => {
    setSteamId('765')
    libraryResponses([unloaded], [loaded])
    const { result, rerender } = renderHook(() => useSteamGamesData(), { wrapper })
    await waitFor(() => expect(result.current.library).toEqual([unloaded]))

    setSteamId(null)
    rerender()
    await new Promise((r) => setTimeout(r, 800))

    expect(libraryCalls()).toBe(1)
    expect(result.current.library).toEqual([])
  })
})

test('unmounting ends a background fill in progress', async () => {
  const unloaded = { _source: 'steam', id: 5, title: 'Pending', hasStats: true, playtimeForever: 60, achievementsLoaded: false }
  setSteamId('765')
  ;(global.fetch as jest.Mock).mockImplementation(async (url: string) =>
    ok(url === '/api/steam/recentlyPlayed' ? RECENT : [unloaded]),
  )
  const { result, unmount } = renderHook(() => useSteamGamesData(), { wrapper })
  await waitFor(() => expect(result.current.library).toEqual([unloaded]))

  unmount()
  await new Promise((r) => setTimeout(r, 800))

  const libraryCalls = (fetch as jest.Mock).mock.calls.filter((c) => c[0] === '/api/steam/ownedGames').length
  expect(libraryCalls).toBe(1)
})

test('loads under Strict Mode, whose dev-only remount discards the first load', async () => {
  // render, not renderHook: only render reproduces Strict Mode's effect
  // unmount/remount, which keeps the provider's refs across the remount.
  setSteamId('765')
  mockRoutes()
  const seen: { library: unknown[] } = { library: [] }
  function Probe() {
    seen.library = useSteamGamesData().library
    return null
  }
  render(
    <StrictMode>
      <SteamGamesDataProvider>
        <Probe />
      </SteamGamesDataProvider>
    </StrictMode>,
  )

  await waitFor(() => expect(seen.library).toEqual(LIBRARY))
})

test('always asks the server, never a browser-cached copy', async () => {
  setSteamId('765')
  mockRoutes()
  const { result } = renderHook(() => useSteamGamesData(), { wrapper })
  await waitFor(() => expect(result.current.libraryLoading).toBe(false))

  for (const call of (fetch as jest.Mock).mock.calls) {
    expect(call[1]).toEqual({ cache: 'no-store' })
  }
})
