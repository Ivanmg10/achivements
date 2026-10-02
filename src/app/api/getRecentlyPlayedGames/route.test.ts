jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getUserRecentlyPlayedGames: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { withCache } from '@/lib/raCache'
import { getUserRecentlyPlayedGames } from '@/lib/raClient'

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
