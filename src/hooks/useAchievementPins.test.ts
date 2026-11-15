import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useAchievementPins, RA_PINS, STEAM_PINS, PSN_PINS, XBOX_PINS, type PinSpec } from './useAchievementPins'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'
import { forgetAnswers } from '@/lib/lastAnswers'
import { SubjectContext } from '@/context/SubjectContext'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

type Item = Record<string, unknown>
type Platform = {
  name: string
  spec: PinSpec<never, string | number>
  /** What the pinned rows look like, and the id fields of two achievements, one pinned and one not. */
  column: string
  pinnedId: string | number
  otherId: string | number
  item: (id: string | number) => Item
  param: string
  game: number
}

const PLATFORMS: Platform[] = [
  { name: 'RA', spec: RA_PINS as never, column: 'achievement_id', pinnedId: 1, otherId: 3, item: (id) => ({ ID: id, Title: 'x' }), param: 'achievementId', game: 10 },
  { name: 'Steam', spec: STEAM_PINS as never, column: 'steam_apiname', pinnedId: 'A', otherId: 'C', item: (id) => ({ apiname: id }), param: 'steamApiname', game: 730 },
  { name: 'PSN', spec: PSN_PINS as never, column: 'psn_trophy_id', pinnedId: 1, otherId: 3, item: (id) => ({ id }), param: 'psnTrophyId', game: 2018800 },
  { name: 'Xbox', spec: XBOX_PINS as never, column: 'xbox_achievement_id', pinnedId: '1', otherId: '3', item: (id) => ({ id }), param: 'xboxAchievementId', game: 1738914043 },
]

function json(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })
}

const signedIn = (id = '7') => (useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { id } } })

beforeEach(() => {
  jest.clearAllMocks()
  forgetAnswers()
  signedIn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe.each(PLATFORMS)('useAchievementPins — $name', (p) => {
  const hook = (game = p.game, title: string | undefined = 'Game') =>
    renderHook(() => useAchievementPins(p.spec as PinSpec<Item, string | number>, game, title, { numDistinctPlayers: 5 }))
  const rows = () => [{ [p.column]: p.pinnedId }]
  const mockFetch = (...answers: Promise<unknown>[]) => {
    const f = jest.fn()
    answers.forEach((a) => f.mockImplementationOnce(() => a))
    f.mockImplementation(() => json({ ok: true }))
    global.fetch = f as unknown as typeof fetch
    return f
  }

  test("reads the game's pins from its source", async () => {
    const f = mockFetch(json(rows()))
    const { result } = hook()
    await waitFor(() => expect(result.current.pins.isPinned(p.item(p.pinnedId))).toBe(true))
    expect(result.current.pins.isPinned(p.item(p.otherId))).toBe(false)
    expect(result.current.pins.leads(p.item(p.pinnedId))).toBe(true)
    expect(f).toHaveBeenCalledWith(`/api/favorites?source=${p.spec.source}&gameId=${p.game}`)
  })

  test('asks for nothing, and offers no pinning, when signed out', () => {
    ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null })
    const f = mockFetch()
    const { result } = hook()
    expect(f).not.toHaveBeenCalled()
    expect(result.current.pins.canPin).toBe(false)
  })

  test("pinning is not offered on someone else's page", () => {
    mockFetch(json([]))
    const wrapper = ({ children }: { children: ReactNode }) => createElement(SubjectContext.Provider, { value: 'ivan' }, children)
    const { result } = renderHook(() => useAchievementPins(p.spec as PinSpec<Item, string | number>, p.game, 'Game'), { wrapper })
    expect(result.current.pins.canPin).toBe(false)
  })

  test('a failed read is reported and leaves the stars empty', async () => {
    mockFetch(json({}, false))
    const { result } = hook()
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.pins.isPinned(p.item(p.pinnedId))).toBe(false)
  })

  test('pins with its own identity in the body, and says so', async () => {
    const f = mockFetch(json(rows()))
    const { result } = hook()
    await waitFor(() => expect(result.current.pins.isPinned(p.item(p.pinnedId))).toBe(true))
    await act(() => result.current.pins.toggle(p.item(p.otherId)))
    const [url, init] = f.mock.calls[1]
    expect(url).toBe('/api/favorites')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toMatchObject({ source: p.spec.source, [p.param]: p.otherId, gameId: p.game, gameTitle: 'Game', numDistinctPlayers: 5 })
    expect(result.current.pins.isPinned(p.item(p.otherId))).toBe(true)
    expect(notify.success).toHaveBeenCalledWith(en.toast.achievementsUpdated)
  })

  test('unpins with a DELETE', async () => {
    const f = mockFetch(json(rows()))
    const { result } = hook()
    await waitFor(() => expect(result.current.pins.isPinned(p.item(p.pinnedId))).toBe(true))
    await act(() => result.current.pins.toggle(p.item(p.pinnedId)))
    expect(f).toHaveBeenLastCalledWith(`/api/favorites?${p.param}=${p.pinnedId}&gameId=${p.game}`, { method: 'DELETE' })
    expect(result.current.pins.isPinned(p.item(p.pinnedId))).toBe(false)
  })

  test.each([
    ['the server refuses', () => json({}, false)],
    ['the network fails', () => Promise.reject(new Error('offline'))],
  ])('rolls back, and says so, when %s', async (_, fail) => {
    mockFetch(json(rows()), fail())
    const { result } = hook()
    await waitFor(() => expect(result.current.pins.isPinned(p.item(p.pinnedId))).toBe(true))
    await act(() => result.current.pins.toggle(p.item(p.otherId)))
    expect(result.current.pins.isPinned(p.item(p.otherId))).toBe(false)
    expect(result.current.error).not.toBeNull()
    expect(notify.error).toHaveBeenCalledWith(en.toast.achievementsFailed)
  })

  test('the list order is the pins as they loaded: pinning one now does not move it', async () => {
    mockFetch(json(rows()))
    const { result } = hook()
    await waitFor(() => expect(result.current.pins.leads(p.item(p.pinnedId))).toBe(true))
    await act(() => result.current.pins.toggle(p.item(p.otherId)))
    expect(result.current.pins.isPinned(p.item(p.otherId))).toBe(true)
    expect(result.current.pins.leads(p.item(p.otherId))).toBe(false)
  })

  test('coming back to a game paints its pins at once, then reads them again (#101)', async () => {
    const f = mockFetch(json(rows()), json([{ [p.column]: p.pinnedId }, { [p.column]: p.otherId }]))
    const first = hook()
    await waitFor(() => expect(first.result.current.pins.isPinned(p.item(p.pinnedId))).toBe(true))
    first.unmount()

    const again = hook()
    expect(again.result.current.pins.isPinned(p.item(p.pinnedId))).toBe(true)
    await waitFor(() => expect(again.result.current.pins.isPinned(p.item(p.otherId))).toBe(true))
    expect(f).toHaveBeenCalledTimes(2)
  })

  test("another game does not show the last one's pins while its own are read", async () => {
    let answer!: (v: unknown) => void
    mockFetch(json(rows()), new Promise((r) => (answer = r)))
    const { result, rerender } = renderHook(({ game }) => useAchievementPins(p.spec as PinSpec<Item, string | number>, game, 'Game'), {
      initialProps: { game: p.game },
    })
    await waitFor(() => expect(result.current.pins.isPinned(p.item(p.pinnedId))).toBe(true))
    rerender({ game: p.game + 1 })
    expect(result.current.pins.isPinned(p.item(p.pinnedId))).toBe(false)
    await act(async () => answer({ ok: true, status: 200, json: () => Promise.resolve([{ [p.column]: p.otherId }]) }))
    expect(result.current.pins.isPinned(p.item(p.otherId))).toBe(true)
  })
})

test('RA asks for nothing until it has a game', () => {
  const f = jest.fn()
  global.fetch = f as unknown as typeof fetch
  renderHook(() => useAchievementPins(RA_PINS, undefined, undefined))
  expect(f).not.toHaveBeenCalled()
})
