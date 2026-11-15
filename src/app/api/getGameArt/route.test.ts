jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getGame: jest.fn() }))
jest.mock('@/lib/apiAuth', () => ({ requireViewerApiKey: jest.fn() }))
jest.mock('@/lib/igdbClient', () => ({ igdbRaArt: jest.fn() }))

import { NextRequest, NextResponse } from 'next/server'
import { GET } from './route'
import { withCache } from '@/lib/raCache'
import { getGame } from '@/lib/raClient'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { igdbRaArt } from '@/lib/igdbClient'

async function call(qs: string) {
  const res = await GET(new NextRequest(`http://localhost/api/getGameArt?${qs}`))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({ ok: true, viewerId: '1', apiKey: 'viewerkey' })
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher())
  ;(getGame as jest.Mock).mockResolvedValue({ Title: 'Super Metroid', ConsoleName: 'SNES/Super Famicom' })
  ;(igdbRaArt as jest.Mock).mockResolvedValue({ heroUrl: 'https://img/hero.jpg', coverUrl: 'https://img/cover.jpg', releaseYear: 1994 })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test.each(['', 'gameId=abc'])('400 for a malformed id: %s', async (qs) => {
  expect((await call(qs)).status).toBe(400)
  expect(igdbRaArt).not.toHaveBeenCalled()
})

test("IGDB's pictures, searched by RA's own title and console with the viewer's key", async () => {
  expect(await call('gameId=1')).toEqual({ status: 200, body: { heroUrl: 'https://img/hero.jpg', coverUrl: 'https://img/cover.jpg' } })
  expect(getGame).toHaveBeenCalledWith('1', 'viewerkey')
  expect(igdbRaArt).toHaveBeenCalledWith('Super Metroid', 'SNES/Super Famicom')
})

test('no match is a plain answer with no pictures', async () => {
  ;(igdbRaArt as jest.Mock).mockResolvedValue(null)
  expect(await call('gameId=1')).toEqual({ status: 200, body: { heroUrl: null, coverUrl: null } })
})

test('hands back whatever the key check refuses with, without asking anyone', async () => {
  ;(requireViewerApiKey as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ message: 'No key' }, { status: 503 }) })
  expect((await call('gameId=1')).status).toBe(503)
  expect(getGame).not.toHaveBeenCalled()
})

test("RA's failure and IGDB's are each a 5xx, not an empty answer", async () => {
  ;(getGame as jest.Mock).mockRejectedValueOnce(new Error('RA API error 500'))
  expect((await call('gameId=1')).status).toBe(503)
  ;(igdbRaArt as jest.Mock).mockRejectedValueOnce(new Error('IGDB down'))
  expect((await call('gameId=1')).status).toBe(503)
  expect(console.error).toHaveBeenCalled()
})
