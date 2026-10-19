import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useFriendsData, loadFriendDetails, DETAIL_LIMIT } from './useFriendsData'
import type { FriendOverview } from '@/utils/friends'

const friend = (username: string, over: Partial<FriendOverview> = {}): FriendOverview => ({
  username, avatar: null, ra: true, steam: false, psn: false, favorites: { ra: null, steam: null, psn: null }, publicGroups: 0, pins: [], ...over,
})

const RA_RECENT = [{ Date: '2026-10-14 08:00:00', Title: 'A' }]
const RA_GAMES = [
  { GameID: 1, Title: 'Zelda', ImageIcon: '', ConsoleID: 3, ConsoleName: 'SNES', MaxPossible: 1, NumAwarded: 1, PctWon: '1', HardcoreMode: '1' },
  { GameID: 9, Title: 'Event', ImageIcon: '', ConsoleID: 101, ConsoleName: 'Events', MaxPossible: 1, NumAwarded: 1, PctWon: '1', HardcoreMode: '1' },
]

function respond(routes: Record<string, unknown>) {
  global.fetch = jest.fn((url: string) => {
    const path = url.split('?')[0]
    if (!(path in routes)) return Promise.resolve({ ok: false, status: 404, json: async () => ({}) })
    return Promise.resolve({ ok: true, json: async () => routes[path] })
  }) as unknown as typeof fetch
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('loadFriendDetails', () => {
  test('reads only the platforms they linked, as them, and builds their activity and games', async () => {
    respond({ '/api/getRecentAchievements': RA_RECENT, '/api/getGamesCompleted': RA_GAMES })
    const d = await loadFriendDetails(friend('a b'), 'en')
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => c[0])
    expect(urls).toEqual(['/api/getRecentAchievements?user=a%20b', '/api/getGamesCompleted?user=a%20b'])
    expect(d.recent).toHaveLength(1)
    // RA's system consoles are not games; each game opens their progress.
    expect(d.games.map((g) => g.href)).toEqual(['/user/a%20b/ra/1'])
    // RA says nothing of play time: the game of the latest unlock is the last one played.
    expect(d.lastPlayed).toMatchObject({ source: 'ra', at: '2026-10-14 08:00:00' })
    expect(d.partial).toBe(false)
  })

  test('a platform that fails leaves the rest, and says the numbers may be short', async () => {
    respond({ '/api/getRecentAchievements': RA_RECENT, '/api/getGamesCompleted': RA_GAMES })
    const d = await loadFriendDetails(friend('x', { steam: true, psn: true }), 'es')
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => c[0])
    expect(urls).toContain('/api/steam/activity?lang=spanish&user=x')
    expect(urls).toContain('/api/psn/recentTrophies?scope=activity&lang=es&user=x')
    expect(d.partial).toBe(true)
    expect(d.recent).toHaveLength(1)
  })

  test('an answer that is not a list counts as a failure', async () => {
    respond({ '/api/getRecentAchievements': { nope: true }, '/api/getGamesCompleted': RA_GAMES })
    expect((await loadFriendDetails(friend('x'), 'en')).partial).toBe(true)
  })
})

describe('useFriendsData', () => {
  test('asks nothing until the section is opened, then the overview and each friend', async () => {
    respond({ '/api/follows/overview': [friend('x')], '/api/getRecentAchievements': RA_RECENT, '/api/getGamesCompleted': RA_GAMES })
    const { result, rerender } = renderHook(({ on }) => useFriendsData(on), { initialProps: { on: false } })
    expect(global.fetch).not.toHaveBeenCalled()
    rerender({ on: true })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.details.x).toBeDefined())
    expect(result.current.friends).toHaveLength(1)
    expect(result.current.detailsLoading).toBe(false)
  })

  test('wanted from the first render, it loads even under Strict Mode (the effect runs twice)', async () => {
    respond({ '/api/follows/overview': [friend('x')], '/api/getRecentAchievements': RA_RECENT, '/api/getGamesCompleted': RA_GAMES })
    const { result } = renderHook(() => useFriendsData(true), { wrapper: StrictMode })
    await waitFor(() => expect(result.current.details.x).toBeDefined())
    expect(result.current.friends).toHaveLength(1)
  })

  test('only the newest few get their details read', async () => {
    const many = Array.from({ length: DETAIL_LIMIT + 3 }, (_, i) => friend(`f${i}`, { ra: false }))
    respond({ '/api/follows/overview': many })
    const { result } = renderHook(() => useFriendsData(true))
    await waitFor(() => expect(Object.keys(result.current.details)).toHaveLength(DETAIL_LIMIT))
    expect(result.current.detailsLoading).toBe(false)
    expect(result.current.friends).toHaveLength(DETAIL_LIMIT + 3)
  })

  test('a failed overview is an error; retry asks again', async () => {
    respond({})
    const { result } = renderHook(() => useFriendsData(true))
    await waitFor(() => expect(result.current.error).toBe(true))
    respond({ '/api/follows/overview': [] })
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.friends).toEqual([]))
    expect(result.current.error).toBe(false)
  })
})
