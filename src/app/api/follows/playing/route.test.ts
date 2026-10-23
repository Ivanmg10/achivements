jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))
jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn(async (_k: string, _t: number, fetcher: () => unknown) => fetcher()) }))
jest.mock('@/lib/steamClient', () => ({ getPlayerSummaries: jest.fn() }))

import { GET } from './route'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { withSteamCache } from '@/lib/steamCache'
import { getPlayerSummaries } from '@/lib/steamClient'

const query = pool.query as jest.Mock
const summaries = getPlayerSummaries as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'key'
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '3' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('who you follow is playing what, by username, from one Steam call', async () => {
  query.mockResolvedValue({ rows: [{ username: 'ivan', steamid: '1' }, { username: 'ana', steamid: '2' }, { username: 'ivan2', steamid: '1' }] })
  summaries.mockResolvedValue({ response: { players: [
    { steamid: '1', gameid: '620', gameextrainfo: 'Portal 2' },
    { steamid: '2' },
  ] } })

  const res = await GET()
  expect(res.data).toEqual({ ivan: { appId: 620, name: 'Portal 2' }, ivan2: { appId: 620, name: 'Portal 2' } })
  expect(summaries).toHaveBeenCalledTimes(1)
  expect(summaries).toHaveBeenCalledWith(['1', '2'], 'key')
  // Only who shares their presence and has a public profile; a minute per viewer.
  const [sql, params] = query.mock.calls[0]
  expect(sql).toContain('u.show_presence')
  expect(sql).toContain('u.profile_public')
  expect(params).toEqual(['3'])
  expect((withSteamCache as jest.Mock).mock.calls[0].slice(0, 2)).toEqual(['steamPlaying:3', 60_000])
})

test('more than 100 accounts take one call per 100', async () => {
  query.mockResolvedValue({ rows: Array.from({ length: 150 }, (_, i) => ({ username: `u${i}`, steamid: String(i) })) })
  summaries.mockResolvedValue({ response: { players: [] } })
  await GET()
  expect(summaries.mock.calls.map((c) => c[0].length)).toEqual([100, 50])
})

test('no Steam key, nothing to say', async () => {
  delete process.env.STEAM_API_KEY
  expect((await GET()).data).toEqual({})
  expect(query).not.toHaveBeenCalled()
})

test('signed out is a 401; Steam down is a 503', async () => {
  ;(requireSession as jest.Mock).mockResolvedValueOnce({ ok: false, response: { status: 401 } })
  expect((await GET()).status).toBe(401)
  query.mockResolvedValue({ rows: [{ username: 'ivan', steamid: '1' }] })
  summaries.mockRejectedValue(new Error('down'))
  expect((await GET()).status).toBe(503)
})
