import { renderHook, waitFor } from '@testing-library/react'
import { useGameInsights } from './useGameInsights'
import { fetchShared } from '@/lib/fetchShared'

jest.mock('@/lib/fetchShared', () => ({ fetchShared: jest.fn() }))
jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en' }) }))

const answer = (body: unknown, ok = true) => (fetchShared as jest.Mock).mockResolvedValue({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })

beforeEach(() => jest.clearAllMocks())

test('nothing is asked for without a game', () => {
  const { result } = renderHook(() => useGameInsights(null, null))
  expect(result.current).toEqual({ items: [], art: [], poster: null, loading: false, error: false })
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

const RA_GAME = { Achievements: {}, NumDistinctPlayers: 3, ImageIngame: '/Images/9.png', ImageTitle: '/Images/8.png', ImageBoxArt: '/Images/7.png' }
const byRoute = (art: { ok: boolean; body: unknown }) =>
  (fetchShared as jest.Mock).mockImplementation((url: string) =>
    Promise.resolve(url.startsWith('/api/getGameArt') ? { ok: art.ok, status: art.ok ? 200 : 503, json: () => Promise.resolve(art.body) } : { ok: true, status: 200, json: () => Promise.resolve(RA_GAME) }),
  )

test('an RA game takes IGDB\'s wide picture first, then its own screenshots', async () => {
  byRoute({ ok: true, body: { heroUrl: 'https://igdb/wide.jpg', coverUrl: 'https://igdb/cover.jpg' } })
  const { result } = renderHook(() => useGameInsights('ra', 5))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(fetchShared).toHaveBeenCalledWith('/api/getGameArt?gameId=5')
  expect(result.current.art).toEqual(['https://igdb/wide.jpg', 'https://retroachievements.org/Images/9.png', 'https://retroachievements.org/Images/8.png'])
  expect(result.current.poster).toBe('https://retroachievements.org/Images/7.png')
})

test('an RA game with no answer from IGDB keeps its own pictures and its achievements', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  byRoute({ ok: false, body: {} })
  const { result } = renderHook(() => useGameInsights('ra', 5))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe(false)
  expect(result.current.art).toEqual(['https://retroachievements.org/Images/9.png', 'https://retroachievements.org/Images/8.png'])
})

test('Xbox takes both its pictures from IGDB, through its details', async () => {
  ;(fetchShared as jest.Mock).mockImplementation((url: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(url.startsWith('/api/xbox/details') ? { heroUrl: 'https://igdb/wide.jpg', coverUrl: 'https://igdb/cover.jpg' } : { achievements: [] }),
    }),
  )
  const { result } = renderHook(() => useGameInsights('xbox', 9))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current).toMatchObject({ art: ['https://igdb/wide.jpg'], poster: 'https://igdb/cover.jpg' })
})

test('Xbox asks for its pictures apart, and goes without them when that fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetchShared as jest.Mock).mockImplementation((url: string) =>
    url.startsWith('/api/xbox/details')
      ? Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
      : Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ achievements: [] }) }),
  )
  const { result } = renderHook(() => useGameInsights('xbox', 9))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.error).toBe(false)
  expect(result.current).toMatchObject({ art: [], poster: null })
})
