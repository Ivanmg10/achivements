jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn((_k: string, _t: number, fn: () => unknown) => fn()) }))
jest.mock('@/lib/raClient', () => ({ getGame: jest.fn() }))
jest.mock('@/lib/steamCache', () => ({ TTL: { schema: 1 }, withSteamCache: jest.fn((_k: string, _t: number, fn: () => unknown) => fn()) }))
jest.mock('@/lib/steamClient', () => ({ getAppDetails: jest.fn() }))
jest.mock('@/lib/psnClient', () => ({ psnTitles: jest.fn(), psnReleaseYear: jest.fn() }))
jest.mock('@/lib/igdbClient', () => ({ igdbArt: jest.fn() }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { getGame } from '@/lib/raClient'
import { getAppDetails } from '@/lib/steamClient'
import { psnReleaseYear, psnTitles } from '@/lib/psnClient'
import { igdbArt } from '@/lib/igdbClient'
import { NextRequest } from 'next/server'

const params = (id = '5') => ({ params: Promise.resolve({ id }) })
const call = (id?: string) => POST(new NextRequest('http://localhost/api/groups/5/years', { method: 'POST' }), params(id))
const data = (res: unknown) => (res as { data: { years: { id: number; release_year: number }[] } }).data

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', raid: 'key' } })
})

test('looks up the missing years once, stores them, and 0 for a game with none', async () => {
  ;(pool.query as jest.Mock)
    .mockResolvedValueOnce({ rows: [{ id: 5 }] })
    .mockResolvedValueOnce({ rows: [{ id: 1, source: 'ra', game_id: 10 }, { id: 2, source: 'steam', game_id: 377160 }, { id: 3, source: 'ra', game_id: 11 }] })
    .mockResolvedValueOnce({ rows: [] })
  ;(getGame as jest.Mock).mockImplementation(async (id: number) => (id === 10 ? { Title: 'A', Released: '2008-03-11' } : { Title: 'B', Released: null }))
  ;(getAppDetails as jest.Mock).mockResolvedValue({ 377160: { success: true, data: { name: 'Fallout 4', release_date: { coming_soon: false, date: '9 NOV 2015' } } } })

  const res = await call()
  expect(res.status).toBe(200)
  expect(data(res).years).toEqual([{ id: 1, release_year: 2008 }, { id: 2, release_year: 2015 }, { id: 3, release_year: 0 }])
  const update = (pool.query as jest.Mock).mock.calls[2]
  expect(update[0]).toMatch(/UPDATE game_group_items/)
  expect(update[1]).toEqual([[1, 2, 3], [2008, 2015, 0], 5])
})

test('a failed lookup is not stored, so a later visit tries again', async () => {
  ;(pool.query as jest.Mock)
    .mockResolvedValueOnce({ rows: [{ id: 5 }] })
    .mockResolvedValueOnce({ rows: [{ id: 1, source: 'ra', game_id: 10 }] })
  ;(getGame as jest.Mock).mockRejectedValue(new Error('RA 503'))
  const res = await call()
  expect(data(res).years).toEqual([])
  expect(pool.query).toHaveBeenCalledTimes(2)
})

test('only the owner can fill a group', async () => {
  ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })
  expect((await call()).status).toBe(403)
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call()).status).toBe(401)
})

test('nothing to do answers at once, without calling RA', async () => {
  ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 5 }] }).mockResolvedValueOnce({ rows: [] })
  expect(data(await call()).years).toEqual([])
  expect(getGame).not.toHaveBeenCalled()
})

test('a database failure is a 500', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect((await call()).status).toBe(500)
})

test('a PSN game is "no year known", never looked up on RA (its number is not an RA id)', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', raid: null } })
  ;(pool.query as jest.Mock)
    .mockResolvedValueOnce({ rows: [{ id: 5 }] })
    .mockResolvedValueOnce({ rows: [{ id: 7, source: 'psn', game_id: 2018800 }] })
    .mockResolvedValueOnce({ rows: [] })

  const res = await call()
  expect(data(res).years).toEqual([{ id: 7, release_year: 0 }])
  expect(getGame).not.toHaveBeenCalled()
})

test('a linked PSN game takes its year from the PS Store, through its concept', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', raid: null, psnaccountid: '42' } })
  ;(psnTitles as jest.Mock).mockResolvedValue([{ id: 2018800, conceptId: 555 }])
  ;(psnReleaseYear as jest.Mock).mockResolvedValue(2024)
  ;(pool.query as jest.Mock)
    .mockResolvedValueOnce({ rows: [{ id: 5 }] })
    .mockResolvedValueOnce({ rows: [{ id: 7, source: 'psn', game_id: 2018800 }] })
    .mockResolvedValueOnce({ rows: [] })

  const res = await call()
  expect(data(res).years).toEqual([{ id: 7, release_year: 2024 }])
  expect(psnReleaseYear).toHaveBeenCalledWith(555)
  expect(getGame).not.toHaveBeenCalled()
})

test('a PS3/Vita game (no Store page) takes its year from IGDB, by title and platform', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', raid: null, psnaccountid: '42' } })
  ;(psnTitles as jest.Mock).mockResolvedValue([{ id: 1143600, conceptId: null, title: 'Jak II', consoleName: 'PS3' }])
  ;(igdbArt as jest.Mock).mockResolvedValue({ coverUrl: null, heroUrl: null, releaseYear: 2003 })
  ;(pool.query as jest.Mock)
    .mockResolvedValueOnce({ rows: [{ id: 5 }] })
    .mockResolvedValueOnce({ rows: [{ id: 8, source: 'psn', game_id: 1143600 }] })
    .mockResolvedValueOnce({ rows: [] })

  const res = await call()
  expect(data(res).years).toEqual([{ id: 8, release_year: 2003 }])
  expect(igdbArt).toHaveBeenCalledWith('Jak II', 'PS3')
  expect(psnReleaseYear).not.toHaveBeenCalled()
})
