jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn(), TTL: { schema: 100 } }))
jest.mock('@/lib/xboxClient', () => ({
  ...jest.requireActual('@/lib/xboxClient'),
  findXboxGame: jest.fn(),
}))
jest.mock('@/lib/igdbClient', () => ({ igdbXboxDetails: jest.fn(), igdbXboxArt: jest.fn() }))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { getServerSession } from 'next-auth'
import { XboxError, findXboxGame } from '@/lib/xboxClient'
import { igdbXboxArt, igdbXboxDetails } from '@/lib/igdbClient'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const GAME = xboxGameFixture({ title: 'Halo', consoleName: 'Xbox Series' })
const DETAILS = { summary: 'S', developers: ['D'], publishers: [], genres: [], releaseDate: '2021-12-08', screenshots: [] }

async function call(qs: string) {
  const res = await GET(new NextRequest(`http://localhost/api/xbox/details?${qs}`))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true, xboxxuid: '25354', xboxgamertag: 'TestPlayer' } })
  ;(findXboxGame as jest.Mock).mockResolvedValue(GAME)
  ;(igdbXboxDetails as jest.Mock).mockResolvedValue(DETAILS)
  ;(igdbXboxArt as jest.Mock).mockResolvedValue({ coverUrl: 'https://img/cover.jpg', heroUrl: 'https://img/hero.jpg', releaseYear: 2021 })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in, 403 for a non-admin', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValueOnce(null)
  expect((await call('id=1738914043')).status).toBe(401)
  ;(getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: '7', xboxxuid: '25354', xboxgamertag: 'x' } })
  expect((await call('id=1738914043')).status).toBe(403)
  expect(igdbXboxDetails).not.toHaveBeenCalled()
})

test.each(['', 'id=abc', 'id=12345678901'])('400 for a malformed id: %s', async (qs) => {
  expect(await call(qs)).toEqual({ status: 400, body: { error: 'invalid-title' } })
})

test('404 for a game the account does not have, and when IGDB knows nothing', async () => {
  ;(findXboxGame as jest.Mock).mockResolvedValueOnce(null)
  expect(await call('id=1738914043')).toEqual({ status: 404, body: { error: 'not-in-library' } })
  ;(igdbXboxDetails as jest.Mock).mockResolvedValueOnce(null)
  expect(await call('id=1738914043')).toEqual({ status: 404, body: { error: 'no-details' } })
})

test("IGDB's facts, a backdrop and the box art, searched by the title in the user's own library", async () => {
  expect(await call('id=1738914043')).toEqual({ status: 200, body: { ...DETAILS, heroUrl: 'https://img/hero.jpg', coverUrl: 'https://img/cover.jpg' } })
  expect(igdbXboxDetails).toHaveBeenCalledWith('Halo', 'Xbox Series')
  expect(igdbXboxArt).toHaveBeenCalledWith('Halo', 'Xbox Series')
})

test('the facts still come when only the pictures fail', async () => {
  ;(igdbXboxArt as jest.Mock).mockRejectedValue(new Error('IGDB down'))
  expect(await call('id=1738914043')).toEqual({ status: 200, body: { ...DETAILS, heroUrl: null, coverUrl: null } })
  expect(console.error).toHaveBeenCalled()
})

test('a failing details call is a 503, and a failing library is Xbox\'s own failure', async () => {
  ;(igdbXboxDetails as jest.Mock).mockRejectedValueOnce(new Error('boom'))
  expect((await call('id=1738914043')).status).toBe(503)
  ;(findXboxGame as jest.Mock).mockRejectedValueOnce(new XboxError('rate-limited', 'slow down'))
  expect((await call('id=1738914043')).status).toBe(429)
})
