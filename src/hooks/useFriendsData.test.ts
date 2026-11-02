import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useFriendsData, loadCards } from './useFriendsData'
import type { FriendOverview } from '@/utils/friends'

const friend = (username: string, over: Partial<FriendOverview> = {}): FriendOverview => ({
  username, avatar: null, ra: true, steam: false, psn: false, favorites: { ra: null, steam: null, psn: null }, publicGroups: 0, showcase: [], ...over,
})
const DETAILS = { recent: [], games: [], lastPlayed: null, partial: false }

function respond(routes: Record<string, unknown>) {
  global.fetch = jest.fn((url: string) => {
    const path = url.split('?')[0]
    if (!(path in routes)) return Promise.resolve({ ok: false, status: 500, json: async () => ({}) })
    return Promise.resolve({ ok: true, json: async () => routes[path] })
  }) as unknown as typeof fetch
}
const urls = () => (global.fetch as jest.Mock).mock.calls.map((c) => c[0])

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

describe('loadCards', () => {
  test('asks the cards in the app\'s language, for either list', async () => {
    respond({ '/api/follows/cards': { friends: [], details: {} } })
    await loadCards('es')
    await loadCards('en', 'followers')
    expect(urls()).toEqual(['/api/follows/cards?lang=es', '/api/follows/cards?lang=en&who=followers'])
  })

  test('an answer that is not the cards is a failure', async () => {
    respond({ '/api/follows/cards': [] })
    await expect(loadCards('en')).rejects.toThrow('unexpected')
  })
})

describe('useFriendsData', () => {
  test('asks nothing until the section is opened, then the cards, whole, in one request (#101)', async () => {
    respond({ '/api/follows/cards': { friends: [friend('x')], details: { x: DETAILS } } })
    const { result, rerender } = renderHook(({ on }) => useFriendsData(on), { initialProps: { on: false } })
    expect(global.fetch).not.toHaveBeenCalled()
    rerender({ on: true })
    expect(result.current).toMatchObject({ isLoading: true, detailsLoading: true })
    await waitFor(() => expect(result.current.details.x).toEqual(DETAILS))
    expect(result.current.friends).toHaveLength(1)
    expect(result.current.detailsLoading).toBe(false)
    expect(urls()).toEqual(['/api/follows/cards?lang=en'])
  })

  test('wanted from the first render, it loads even under Strict Mode (the effect runs twice)', async () => {
    respond({ '/api/follows/cards': { friends: [friend('x')], details: { x: DETAILS } } })
    const { result } = renderHook(() => useFriendsData(true), { wrapper: StrictMode })
    await waitFor(() => expect(result.current.details.x).toBeDefined())
    expect(result.current.friends).toHaveLength(1)
  })

  test('a failure is an error, never a half list; retry asks again', async () => {
    respond({})
    const { result } = renderHook(() => useFriendsData(true))
    await waitFor(() => expect(result.current.error).toBe(true))
    expect(result.current.detailsLoading).toBe(false)
    respond({ '/api/follows/cards': { friends: [], details: {} } })
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.friends).toEqual([]))
    expect(result.current.error).toBe(false)
  })

  test('a friend in a Steam game right now carries its name; a failure shows none', async () => {
    respond({
      '/api/follows/cards': { friends: [friend('x', { ra: false, steam: true }), friend('y', { ra: false, steam: true })], details: {} },
      '/api/follows/playing': { x: { appId: 620, name: 'Portal 2' } },
    })
    const { result } = renderHook(() => useFriendsData(true))
    await waitFor(() => expect(result.current.friends?.[0].playing).toBe('Portal 2'))
    expect(result.current.friends?.[1].playing).toBeUndefined()
  })

  test('nobody on Steam, nobody asked about', async () => {
    respond({ '/api/follows/cards': { friends: [friend('x', { ra: false })], details: {} } })
    const { result } = renderHook(() => useFriendsData(true))
    await waitFor(() => expect(result.current.friends).toHaveLength(1))
    expect(urls()).not.toContain('/api/follows/playing')
  })
})
