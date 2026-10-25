import { renderHook, waitFor } from '@testing-library/react'
import { useGameInsights } from './useGameInsights'
import { fetchShared } from '@/lib/fetchShared'

jest.mock('@/lib/fetchShared', () => ({ fetchShared: jest.fn() }))
jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en' }) }))

const answer = (body: unknown, ok = true) => (fetchShared as jest.Mock).mockResolvedValue({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })

beforeEach(() => jest.clearAllMocks())

test('nothing is asked for without a game', () => {
  const { result } = renderHook(() => useGameInsights(null, null))
  expect(result.current).toEqual({ items: [], art: null, loading: false, error: false })
  expect(fetchShared).not.toHaveBeenCalled()
})

test('a Steam game is read through its page\'s route and comes back as insights', async () => {
  answer([{ apiname: 'A', title: 'First', description: 'd', earned: false, dateEarned: null, globalPct: 40, badgeUrl: null, hidden: false }])
  const { result } = renderHook(() => useGameInsights('steam', 620))
  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(fetchShared).toHaveBeenCalledWith(expect.stringContaining('/api/steam/achievements?appid=620'))
  expect(result.current.items).toHaveLength(1)
  expect(result.current.items[0]).toMatchObject({ title: 'First', earned: false })
})

test('a refused answer is an error, not an empty game', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  answer({}, false)
  const { result } = renderHook(() => useGameInsights('ra', 1))
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.items).toEqual([])
})

test('an RA game comes with its in-game screenshot as wide art', async () => {
  answer({ Achievements: {}, NumDistinctPlayers: 3, ImageIngame: '/Images/9.png', ImageTitle: '/Images/8.png' })
  const { result } = renderHook(() => useGameInsights('ra', 5))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.art).toBe('https://retroachievements.org/Images/9.png')
})

test('Xbox asks for its wide art apart, and goes without it when that fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetchShared as jest.Mock).mockImplementation((url: string) =>
    url.startsWith('/api/xbox/details')
      ? Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
      : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ achievements: [] }) }),
  )
  const { result } = renderHook(() => useGameInsights('xbox', 9))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe(false)
  expect(result.current.art).toBeNull()
})
