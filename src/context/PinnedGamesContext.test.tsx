import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { PinnedGamesProvider, usePinnedGames } from './PinnedGamesContext'

global.fetch = jest.fn()

function wrapper({ children }: { children: React.ReactNode }) {
  return <PinnedGamesProvider>{children}</PinnedGamesProvider>
}

function signedIn() {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
}

async function renderLoaded(rows: unknown[] = []) {
  signedIn()
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => rows })
  const hook = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('returns defaults when used outside the provider', async () => {
  const { result } = renderHook(() => usePinnedGames())
  expect(result.current.pins).toEqual([])
  expect(result.current.isPinned(1)).toBe(false)
  await expect(result.current.pinGame(1)).resolves.toBeUndefined()
  await expect(result.current.unpinGame(1)).resolves.toBeUndefined()
  await expect(result.current.reorder([])).resolves.toBeUndefined()
})

test('does not fetch when unauthenticated', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current.pins).toEqual([])
})

test('waits while the session is loading', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'loading' })
  renderHook(() => usePinnedGames(), { wrapper })
  expect(fetch).not.toHaveBeenCalled()
})

test('loads pins once, with their platform — RA and Steam kept apart', async () => {
  const { result, rerender } = await renderLoaded([
    { source: 'ra', game_id: 730, position: 0 },
    { source: 'steam', game_id: 730, position: 1 },
  ])

  expect(result.current.pins).toEqual([{ source: 'ra', id: 730 }, { source: 'steam', id: 730 }])
  expect(result.current.isPinned(730)).toBe(true)
  expect(result.current.isPinned(730, 'steam')).toBe(true)
  expect(result.current.isPinned(99, 'steam')).toBe(false)

  rerender()
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('treats rows without a source (older API) as RA', async () => {
  const { result } = await renderLoaded([{ game_id: 10, position: 0 }])
  expect(result.current.pins).toEqual([{ source: 'ra', id: 10 }])
  expect(result.current.isPinned(10, 'steam')).toBe(false)
})

test('empties the pins when the GET fails', async () => {
  signedIn()
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false })
  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.pins).toEqual([])
})

test('clears the pins on sign-out', async () => {
  const { result, rerender } = await renderLoaded([{ source: 'ra', game_id: 1, position: 0 }])
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  rerender()
  expect(result.current.pins).toEqual([])
})

describe('pinGame', () => {
  test('adds optimistically and POSTs the platform, RA by default', async () => {
    const { result } = await renderLoaded()
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })

    await act(async () => { await result.current.pinGame(5) })
    expect(result.current.pins).toEqual([{ source: 'ra', id: 5 }])
    expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)).toEqual({ gameId: 5, source: 'ra' })
  })

  test('pins a Steam game', async () => {
    const { result } = await renderLoaded()
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })

    await act(async () => { await result.current.pinGame(730, 'steam') })
    expect(result.current.isPinned(730, 'steam')).toBe(true)
    expect(result.current.isPinned(730)).toBe(false)
  })

  test('does not duplicate an existing pin', async () => {
    const { result } = await renderLoaded([{ source: 'steam', game_id: 730, position: 0 }])
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
    await act(async () => { await result.current.pinGame(730, 'steam') })
    expect(result.current.pins).toHaveLength(1)
  })

  test('reverts and rethrows when the POST fails', async () => {
    const { result } = await renderLoaded()
    ;(fetch as jest.Mock).mockResolvedValue({ ok: false })

    await act(async () => {
      await expect(result.current.pinGame(5, 'steam')).rejects.toThrow('Error pinning game')
    })
    expect(result.current.pins).toEqual([])
  })
})

describe('unpinGame', () => {
  test('removes only that platform\'s pin and DELETEs it', async () => {
    const { result } = await renderLoaded([
      { source: 'ra', game_id: 730, position: 0 },
      { source: 'steam', game_id: 730, position: 1 },
    ])
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })

    await act(async () => { await result.current.unpinGame(730, 'steam') })
    expect(result.current.pins).toEqual([{ source: 'ra', id: 730 }])
    expect((fetch as jest.Mock).mock.calls[1][0]).toBe('/api/pinnedGames?gameId=730&source=steam')
  })

  test('defaults to RA', async () => {
    const { result } = await renderLoaded([{ source: 'ra', game_id: 5, position: 0 }])
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
    await act(async () => { await result.current.unpinGame(5) })
    expect((fetch as jest.Mock).mock.calls[1][0]).toBe('/api/pinnedGames?gameId=5&source=ra')
  })

  test('restores and rethrows when the DELETE fails', async () => {
    const { result } = await renderLoaded([{ source: 'ra', game_id: 5, position: 0 }])
    ;(fetch as jest.Mock).mockResolvedValue({ ok: false })

    await act(async () => {
      await expect(result.current.unpinGame(5)).rejects.toThrow('Error unpinning game')
    })
    expect(result.current.pins).toEqual([{ source: 'ra', id: 5 }])
  })

  test('does not duplicate when restoring a pin that came back meanwhile', async () => {
    const { result } = await renderLoaded([{ source: 'ra', game_id: 5, position: 0 }])
    let reject!: () => void
    ;(fetch as jest.Mock).mockImplementationOnce(() => new Promise((_, r) => { reject = () => r(new Error('x')) }))
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })

    let unpin!: Promise<void>
    act(() => { unpin = result.current.unpinGame(5) })
    await act(async () => { await result.current.pinGame(5) })
    await act(async () => {
      reject()
      await expect(unpin).rejects.toThrow()
    })
    expect(result.current.pins).toEqual([{ source: 'ra', id: 5 }])
  })
})

describe('reorder', () => {
  test('updates optimistically and PUTs source and id for each pin', async () => {
    const { result } = await renderLoaded()
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })

    const order = [{ source: 'steam' as const, id: 730 }, { source: 'ra' as const, id: 730 }]
    await act(async () => { await result.current.reorder(order) })
    expect(result.current.pins).toEqual(order)
    expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)).toEqual({
      order: [{ source: 'steam', gameId: 730 }, { source: 'ra', gameId: 730 }],
    })
  })

  test('throws when the PUT fails', async () => {
    const { result } = await renderLoaded()
    ;(fetch as jest.Mock).mockResolvedValue({ ok: false })
    await act(async () => {
      await expect(result.current.reorder([])).rejects.toThrow('Error saving order')
    })
  })
})
