jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getUserRecentlyPlayedGames: jest.fn() }))
jest.mock('@/lib/publicUser', () => ({ hiddenGameKeys: jest.fn().mockResolvedValue([]), findSubject: jest.fn() }))

import { GET } from './route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { withCache } from '@/lib/raCache'
import { getUserRecentlyPlayedGames } from '@/lib/raClient'
import { hiddenGameKeys, findSubject } from '@/lib/publicUser'

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', rausername: 'ivan', raid: 'key' } })
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

test('401 without a session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await GET()).status).toBe(401)
})

test('an empty list without an RA account', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  expect(((await GET()) as unknown as { data: unknown }).data).toEqual([])
  expect(getUserRecentlyPlayedGames).not.toHaveBeenCalled()
})

test('answers with the games, cached per user', async () => {
  ;(getUserRecentlyPlayedGames as jest.Mock).mockResolvedValue([{ GameID: 1 }])
  const res = await GET()
  expect(res.status).toBe(200)
  expect(getUserRecentlyPlayedGames).toHaveBeenCalledWith('ivan', 'key', 500)
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('recentlyPlayed:1')
})

test('503 when RA fails', async () => {
  ;(getUserRecentlyPlayedGames as jest.Mock).mockRejectedValue(new Error('RA down'))
  expect((await GET()).status).toBe(503)
})

test('a public view filters with the profile owner keys, not the viewer keys', async () => {
  ;(findSubject as jest.Mock).mockResolvedValue({ id: 2, rausername: 'bob', raid: 'owner-key', profilePublic: true })
  ;(getUserRecentlyPlayedGames as jest.Mock).mockResolvedValue([{ GameID: 1 }, { GameID: 2 }])
  ;(hiddenGameKeys as jest.Mock).mockResolvedValue(['ra:1'])

  const res = await GET(new NextRequest('http://localhost/api/getRecentlyPlayedGames?user=bob'))
  expect((res as unknown as { data: { GameID: number }[] }).data).toEqual([{ GameID: 2 }])
  expect(hiddenGameKeys).toHaveBeenCalledWith(2)
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('recentlyPlayed:2')
})

test('filters hidden games from an already-warm cached response', async () => {
  ;(getUserRecentlyPlayedGames as jest.Mock).mockResolvedValue([{ GameID: 1 }, { GameID: 2 }])
  ;(hiddenGameKeys as jest.Mock).mockResolvedValue(['ra:1'])

  const res = await GET()
  expect((res as unknown as { data: { GameID: number }[] }).data).toEqual([{ GameID: 2 }])
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=0')
})
