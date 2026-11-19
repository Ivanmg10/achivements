jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/queryRows', () => ({ queryRows: jest.fn(async () => [{ preferences: { 'hidden-consoles:psn': '["PS3"]' } }]) }))
jest.mock('@/lib/gameVisibility', () => ({ visibleGamesForUser: jest.fn(async (_id: string, list: Array<{ id?: number; gameId?: number }>) => list.filter((g) => (g.id ?? g.gameId) !== 3)) }))
jest.mock('@/lib/publicUser', () => ({ findSubject: jest.fn(async () => ({ id: 7, psnaccountid: '42', profilePublic: true })) }))
jest.mock('@/lib/psnSnapshot', () => ({ psnSummary: jest.fn(), psnLibrary: jest.fn(), psnLatestTrophies: jest.fn(), psnSyncState: jest.fn(), psnGame: jest.fn() }))

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET as bootstrap } from './route'
import { GET as games } from '../games/route'
import { GET as status } from '../status/route'
import { PsnSyncing } from '@/lib/psnErrors'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { psnLatestTrophies, psnLibrary, psnSummary, psnSyncState } from '@/lib/psnSnapshot'

const body = (res: Response) => (res as unknown as { data: Record<string, unknown> }).data
const LIBRARY = [
  psnGameFixture({ id: 1, title: 'Zelda-like', consoleName: 'PS5', lastPlayed: '2026-01-01', pctWon: 10 }),
  psnGameFixture({ id: 2, title: 'Astro', consoleName: 'PS5', lastPlayed: '2026-03-01', pctWon: 90 }),
  psnGameFixture({ id: 3, title: 'Hidden one', consoleName: 'PS5', lastPlayed: '2026-04-01' }),
  psnGameFixture({ id: 4, title: 'Old PS3', consoleName: 'PS3', lastPlayed: '2026-05-01' }),
]
const SYNC = { state: 'ready', syncedAt: 1, nextSyncAt: 2, pending: { year: 0, total: 0 }, yearReady: true, jobs: [] }

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  ;(psnSummary as jest.Mock).mockResolvedValue({ onlineId: 'p' })
  ;(psnLibrary as jest.Mock).mockResolvedValue(LIBRARY)
  ;(psnLatestTrophies as jest.Mock).mockResolvedValue([{ gameId: 2 }, { gameId: 3 }])
  ;(psnSyncState as jest.Mock).mockResolvedValue(SYNC)
})
afterEach(() => (console.error as jest.Mock).mockRestore())

describe('/api/psn/bootstrap', () => {
  test('the summary, the first games without hidden ones or unticked consoles, the latest trophies and the sync state', async () => {
    const res = await bootstrap(new NextRequest('http://localhost/api/psn/bootstrap?lang=es'))
    expect(res.status).toBe(200)
    expect(body(res)).toEqual({ summary: { onlineId: 'p' }, games: [LIBRARY[1], LIBRARY[0]], totalGames: 2, recent: [{ gameId: 2 }], sync: SYNC })
    expect(psnLatestTrophies).toHaveBeenCalledWith('42', '7', 'es-ES')
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=60')
    expect(res.headers.get('Vary')).toBe('Cookie')
  })

  test('202 while nothing is stored; the latest trophies alone still being read are null', async () => {
    ;(psnLatestTrophies as jest.Mock).mockRejectedValueOnce(new PsnSyncing())
    expect(body(await bootstrap(new NextRequest('http://localhost/api/psn/bootstrap'))).recent).toBeNull()
    ;(psnSummary as jest.Mock).mockRejectedValueOnce(new PsnSyncing())
    expect((await bootstrap(new NextRequest('http://localhost/api/psn/bootstrap'))).status).toBe(202)
  })

  test('401 signed out', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect((await bootstrap(new NextRequest('http://localhost/api/psn/bootstrap'))).status).toBe(401)
  })
})

describe('/api/psn/games', () => {
  const page = async (qs: string) => body(await games(new NextRequest(`http://localhost/api/psn/games?${qs}`)))

  test('a page, sorted, searched, at most 50', async () => {
    expect(await page('')).toMatchObject({ total: 2, page: 1, limit: 50 })
    expect(((await page('sort=title')).games as Array<{ id: number }>).map((g) => g.id)).toEqual([2, 1])
    expect(((await page('sort=progress')).games as Array<{ id: number }>).map((g) => g.id)).toEqual([2, 1])
    expect(((await page('q=ZELDA')).games as Array<{ id: number }>).map((g) => g.id)).toEqual([1])
    expect(await page('limit=1&page=2')).toMatchObject({ games: [LIBRARY[0]], total: 2, page: 2, limit: 1 })
    expect(await page('limit=500&page=-3&sort=nope')).toMatchObject({ page: 1, limit: 50 })
  })

  test("someone else's list keeps the consoles the viewer unticked", async () => {
    expect((await page('user=friend')).total).toBe(3)
  })

  test('202 before the first sync', async () => {
    ;(psnLibrary as jest.Mock).mockRejectedValueOnce(new PsnSyncing())
    expect((await games(new NextRequest('http://localhost/api/psn/games'))).status).toBe(202)
  })
})

describe('/api/psn/status', () => {
  test('the sync state, never kept by the browser', async () => {
    const res = await status(new NextRequest('http://localhost/api/psn/status'))
    expect(body(res)).toEqual(SYNC)
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=0')
  })

  test('500 when the database fails', async () => {
    ;(psnSyncState as jest.Mock).mockRejectedValueOnce(new Error('db'))
    expect((await status(new NextRequest('http://localhost/api/psn/status'))).status).toBe(500)
  })
})
