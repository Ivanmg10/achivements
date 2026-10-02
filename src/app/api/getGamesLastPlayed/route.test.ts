jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getGameInfoAndUserProgress: jest.fn() }))

import { GET } from './route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { withCache } from '@/lib/raCache'
import { getGameInfoAndUserProgress } from '@/lib/raClient'

const request = (query: string) => new NextRequest(`http://localhost/api/getGamesLastPlayed?${query}`)
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', rausername: 'ivan', raid: 'key' } })
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

test('401 without a session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await GET(request('gameIds=1'))).status).toBe(401)
})

test('nothing to answer without an RA account or without ids', async () => {
  expect(data(await GET(request('')))).toEqual({})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  expect(data(await GET(request('gameIds=1')))).toEqual({})
  expect(getGameInfoAndUserProgress).not.toHaveBeenCalled()
})

test('the latest unlock of each game, hardcore date first', async () => {
  ;(getGameInfoAndUserProgress as jest.Mock).mockImplementation((_u: string, _k: string, id: number) =>
    Promise.resolve(
      id === 1
        ? { ID: 1, Achievements: { a: { DateEarned: '2024-01-01' }, b: { DateEarned: '2024-03-01', DateEarnedHardcore: '2024-02-01' } } }
        : { ID: 2, Achievements: {} },
    ),
  )
  const res = await GET(request('gameIds=1,2'))
  expect(data(res)).toEqual({ 1: '2024-02-01', 2: null })
  expect(res.headers.get('Cache-Control')).toMatch(/^private/)
})

test('a game that fails comes back without a date, the rest still answer', async () => {
  ;(getGameInfoAndUserProgress as jest.Mock)
    .mockRejectedValueOnce(new Error('RA down'))
    .mockResolvedValue({ ID: 2, Achievements: { a: { DateEarned: '2024-01-01' } } })
  expect(data(await GET(request('gameIds=1,2')))).toEqual({ 1: null, 2: '2024-01-01' })
})

test('ignores ids that are not numbers', async () => {
  ;(getGameInfoAndUserProgress as jest.Mock).mockResolvedValue({ ID: 3, Achievements: {} })
  await GET(request('gameIds=abc,3,-4,1.5'))
  expect(getGameInfoAndUserProgress).toHaveBeenCalledTimes(1)
})

test('one request cannot fan out into hundreds of RA calls', async () => {
  const ids = Array.from({ length: 101 }, (_, i) => i + 1).join(',')
  expect((await GET(request(`gameIds=${ids}`))).status).toBe(400)
  expect(getGameInfoAndUserProgress).not.toHaveBeenCalled()
})
