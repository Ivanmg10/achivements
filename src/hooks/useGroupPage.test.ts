jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

import { act, renderHook, waitFor } from '@testing-library/react'
import { useGroupPage } from './useGroupPage'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'
import type { GameGroupItem } from '@/types/types'

const item = (id: number, over: Partial<GameGroupItem> = {}): GameGroupItem => ({
  id, source: 'ra', game_id: id * 10, title: `Game ${id}`, image_icon: null, console_name: 'SNES', pct_won: '0.5',
  num_awarded: 5, max_possible: 10, points_won: 50, max_points: 100, position: id, added_at: '2026-01-01', release_year: 1995,
  ...over,
})
const GROUP = (items: GameGroupItem[]) => ({ id: 3, title: 'Backlog', description: '', icon: '', is_public: false, items })

const answer = (body: unknown, ok = true, status = ok ? 200 : 500) => ({ ok, status, json: () => Promise.resolve(body) })
const fetchMock = () => global.fetch as jest.Mock
const callsTo = (fragment: string, method?: string) =>
  fetchMock().mock.calls.filter(([url, init]) => String(url).includes(fragment) && (!method || (init?.method ?? 'GET') === method))

/** Routes each request by method and path; anything not listed is a 200 with {}. */
function server(routes: Record<string, unknown> = {}) {
  fetchMock().mockImplementation((url: string, init?: { method?: string }) => {
    const key = `${init?.method ?? 'GET'} ${url}`
    const hit = Object.entries(routes).find(([k]) => key === k)
    const value = hit ? hit[1] : {}
    return Promise.resolve(typeof value === 'function' ? (value as () => unknown)() : answer(value))
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  global.fetch = jest.fn()
})
afterEach(() => {
  ;(console.error as jest.Mock).mockRestore()
  jest.useRealTimers()
})

describe('loading', () => {
  test('loads the group and becomes ready', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1), item(2)]) })
    const { result } = renderHook(() => useGroupPage(3, []))
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.group?.items.map((i) => i.id)).toEqual([1, 2])
  })

  test.each([401, 403, 404])('a %i means the group is gone or not yours', async (status) => {
    fetchMock().mockResolvedValue(answer({}, false, status))
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('missing'))
    expect(result.current.group).toBeNull()
  })

  test('any other failure is an error that retry can fix', async () => {
    fetchMock().mockResolvedValue(answer({}, false, 500))
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('error'))
    server({ 'GET /api/groups/3': GROUP([item(1)]) })
    await act(async () => { await result.current.retry() })
    await waitFor(() => expect(result.current.status).toBe('ready'))
  })

  test('a network failure is the same error, not a crash', async () => {
    fetchMock().mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  test('a group id that is not a number asks for nothing', () => {
    renderHook(() => useGroupPage(Number.NaN, []))
    expect(fetch).not.toHaveBeenCalled()
  })

  test('asks only once however often it re-renders', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]) })
    const { result, rerender } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    rerender()
    expect(callsTo('/api/groups/3', 'GET')).toHaveLength(1)
  })
})

describe('release years', () => {
  test('are looked up once, on the server, when a game has none, and merged in', async () => {
    server({
      'GET /api/groups/3': GROUP([item(1, { release_year: null }), item(2)]),
      'POST /api/groups/3/years': { years: [{ id: 1, release_year: 1991 }] },
    })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.group?.items[0].release_year).toBe(1991))
    expect(result.current.group?.items[1].release_year).toBe(1995)
    expect(callsTo('/years', 'POST')).toHaveLength(1)
  })

  test('are not asked for when every game has one', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(callsTo('/years')).toHaveLength(0)
  })

  test('a failed lookup only costs the decade filter: the group still shows', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1, { release_year: null })]), 'POST /api/groups/3/years': () => answer({}, false) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(callsTo('/years', 'POST')).toHaveLength(1))
    expect(result.current.status).toBe('ready')
  })
})

describe('keeping the stored counts fresh', () => {
  const played = { GameID: 10, NumAchievedHardcore: 8, NumAchieved: 3, NumPossibleAchievements: 20, ScoreAchievedHardcore: 80, ScoreAchieved: 30, PossibleScore: 200 }

  test('counts from the recently played feed are sent once for the games that are in it', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1), item(2)]) })
    const { result } = renderHook(() => useGroupPage(3, [played as never]))
    await waitFor(() => expect(callsTo('/games', 'PATCH')).toHaveLength(1))
    const body = JSON.parse(callsTo('/games', 'PATCH')[0][1].body)
    expect(body).toEqual([{ source: 'ra', game_id: 10, num_awarded: 8, max_possible: 20, points_won: 80, max_points: 200 }])
    expect(result.current.status).toBe('ready')
  })

  test('a game with no counts anywhere is asked of RA, and its counts merged in and saved', async () => {
    server({
      'GET /api/groups/3': GROUP([item(1, { max_possible: 0, num_awarded: 0 })]),
      'GET /api/getGameProgression?gameId=10': {
        Achievements: {
          a: { Points: 10, DateEarned: '2026-01-01' },
          b: { Points: 5, DateEarned: null, DateEarnedHardcore: null },
        },
      },
    })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.group?.items[0].max_possible).toBe(2))
    expect(result.current.group?.items[0]).toMatchObject({ num_awarded: 1, points_won: 10, max_points: 15 })
    await waitFor(() => expect(callsTo('/games', 'PATCH')).toHaveLength(1))
  })

  test('a game RA knows no achievements for is left as it was', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1, { max_possible: 0 })]), 'GET /api/getGameProgression?gameId=10': { Achievements: {} } })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(callsTo('getGameProgression')).toHaveLength(1))
    expect(result.current.group?.items[0].max_possible).toBe(0)
    expect(callsTo('/games', 'PATCH')).toHaveLength(0)
  })

  test('a failed lookup leaves the group alone', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1, { max_possible: 0 })]), 'GET /api/getGameProgression?gameId=10': () => answer({}, false) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(callsTo('getGameProgression')).toHaveLength(1))
    expect(result.current.status).toBe('ready')
    expect(callsTo('/games', 'PATCH')).toHaveLength(0)
  })
})

describe('reordering', () => {
  test('moves the game at once and saves the new order after a short pause, once', async () => {
    jest.useFakeTimers()
    server({ 'GET /api/groups/3': GROUP([item(1), item(2), item(3)]) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await act(async () => { await jest.advanceTimersByTimeAsync(0) })
    act(() => result.current.reorder(1, 3))
    act(() => result.current.reorder(3, 2))
    // 1 over 3 gives [2, 3, 1]; then 3 over 2 gives [3, 2, 1].
    expect(result.current.group?.items.map((i) => i.id)).toEqual([3, 2, 1])
    expect(callsTo('/games', 'PUT')).toHaveLength(0)
    await act(async () => { await jest.advanceTimersByTimeAsync(700) })
    const puts = callsTo('/games', 'PUT')
    expect(puts).toHaveLength(1)
    expect(JSON.parse(puts[0][1].body)).toEqual({ order: result.current.group?.items.map((i) => i.id) })
  })

  test('an id that is not in the group moves nothing', async () => {
    jest.useFakeTimers()
    server({ 'GET /api/groups/3': GROUP([item(1), item(2)]) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await act(async () => { await jest.advanceTimersByTimeAsync(0) })
    act(() => result.current.reorder(1, 99))
    await act(async () => { await jest.advanceTimersByTimeAsync(700) })
    expect(callsTo('/games', 'PUT')).toHaveLength(0)
  })

  test('an order that could not be saved says so and reloads the one that stuck', async () => {
    jest.useFakeTimers()
    server({ 'GET /api/groups/3': GROUP([item(1), item(2)]), 'PUT /api/groups/3/games': () => answer({}, false) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await act(async () => { await jest.advanceTimersByTimeAsync(0) })
    act(() => result.current.reorder(1, 2))
    await act(async () => { await jest.advanceTimersByTimeAsync(700) })
    expect(notify.error).toHaveBeenCalledWith(en.toast.orderFailed)
    expect(callsTo('/api/groups/3', 'GET').length).toBeGreaterThanOrEqual(2)
  })
})

describe('removing a game', () => {
  test('removes it, and offers to undo', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1), item(2)]) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => { await result.current.removeGame(1) })
    expect(result.current.group?.items.map((i) => i.id)).toEqual([2])
    expect(callsTo('gameId=10&source=ra', 'DELETE')).toHaveLength(1)
    expect(notify.success).toHaveBeenCalledWith(en.toast.gameRemoved, { action: { label: en.toast.undo, onClick: expect.any(Function) } })
  })

  test('undo puts it back where it was', async () => {
    jest.useFakeTimers()
    server({
      'GET /api/groups/3': GROUP([item(1), item(2), item(3)]),
      'POST /api/groups/3/games': { id: 9, position: 0 },
    })
    const { result } = renderHook(() => useGroupPage(3, []))
    await act(async () => { await jest.advanceTimersByTimeAsync(0) })
    await act(async () => { await result.current.removeGame(2) })
    const undo = (notify.success as jest.Mock).mock.calls[0][1].action.onClick as () => Promise<void>
    await act(async () => { await undo() })
    expect(result.current.group?.items.map((i) => i.game_id)).toEqual([10, 20, 30])
    expect(notify.success).toHaveBeenLastCalledWith(en.toast.gameRestored)
  })

  test('a refused removal says so and keeps the game', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]), 'DELETE /api/groups/3/games?gameId=10&source=ra': () => answer({}, false) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => { await result.current.removeGame(1) })
    expect(notify.error).toHaveBeenCalledWith(en.toast.gameRemoveFailed)
    expect(result.current.group?.items).toHaveLength(1)
  })

  test('removing a game that is not there does nothing', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => { await result.current.removeGame(99) })
    expect(callsTo('/games', 'DELETE')).toHaveLength(0)
  })

  test('a failed undo says so', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]), 'POST /api/groups/3/games': () => answer({}, false) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => { await result.current.removeGame(1) })
    const undo = (notify.success as jest.Mock).mock.calls[0][1].action.onClick as () => Promise<void>
    await act(async () => { await undo() })
    expect(notify.error).toHaveBeenCalledWith(en.toast.gameRestoreFailed)
  })
})

describe('adding, editing, deleting', () => {
  test('added games join the list, and ones with no year ask for it', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]), 'POST /api/groups/3/years': { years: [] } })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.addItems([item(2, { release_year: null })]))
    expect(result.current.group?.items.map((i) => i.id)).toEqual([1, 2])
    await waitFor(() => expect(callsTo('/years', 'POST')).toHaveLength(1))
  })

  test('editing saves, updates the group and says so', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]), 'PUT /api/groups/3': { id: 3, title: 'Renamed' } })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(async () => { await result.current.edit({ title: 'Renamed', description: '', icon: '', is_public: true }) })
    expect(result.current.group?.title).toBe('Renamed')
    expect(notify.success).toHaveBeenCalledWith(en.toast.groupSaved)
    const body = JSON.parse(callsTo('/api/groups/3', 'PUT')[0][1].body)
    expect(body).toEqual({ title: 'Renamed', is_public: true })
  })

  test('a refused edit throws the server message, for the modal to show', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]), 'PUT /api/groups/3': () => answer({ message: 'Title taken' }, false, 409) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await expect(result.current.edit({ title: 'X', description: '', icon: '', is_public: false })).rejects.toThrow('Title taken')
  })

  test('deleting says so and reports the group gone', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    let gone = false
    await act(async () => { gone = await result.current.remove() })
    expect(gone).toBe(true)
    expect(notify.success).toHaveBeenCalledWith(en.toast.groupDeleted)
  })

  test('a refused delete says so and reports the group still there', async () => {
    server({ 'GET /api/groups/3': GROUP([item(1)]), 'DELETE /api/groups/3': () => answer({}, false) })
    const { result } = renderHook(() => useGroupPage(3, []))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    let gone = true
    await act(async () => { gone = await result.current.remove() })
    expect(gone).toBe(false)
    expect(notify.error).toHaveBeenCalledWith(en.toast.groupDeleteFailed)
  })
})
