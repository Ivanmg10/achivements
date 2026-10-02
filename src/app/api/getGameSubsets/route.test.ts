jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/raCache', () => ({ withCache: jest.fn() }))
jest.mock('@/lib/raClient', () => ({ getGameList: jest.fn() }))

import { GET } from './route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { withCache } from '@/lib/raCache'
import { getGameList } from '@/lib/raClient'

const request = (query: string) => new NextRequest(`http://localhost/api/getGameSubsets?${query}`)
const QUERY = `gameId=1&consoleId=7&baseTitle=${encodeURIComponent('Zelda')}`

const LIST = [
  { ID: 1, Title: 'Zelda', NumAchievements: 50, ImageIcon: '/a.png' },
  { ID: 2, Title: 'Zelda [Subset - Bonus]', NumAchievements: 10, ImageIcon: '/b.png' },
  { ID: 3, Title: 'Zelda | Extra [Subset - Speedrun]', NumAchievements: 5, ImageIcon: '/c.png' },
  { ID: 4, Title: 'Zelda II [Subset - Bonus]', NumAchievements: 5, ImageIcon: '/d.png' },
  { ID: 5, Title: 'Zelda Hack', NumAchievements: 5, ImageIcon: '/e.png' },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', raid: 'key' } })
  ;(withCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => unknown) => fetcher())
})

test('401 without a session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await GET(request(QUERY))).status).toBe(401)
})

test('400 when a parameter is missing', async () => {
  expect((await GET(request('gameId=1&consoleId=7'))).status).toBe(400)
})

test('no RA key, no subsets', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  const res = await GET(request(QUERY))
  expect((res as unknown as { data: unknown }).data).toEqual([])
  expect(getGameList).not.toHaveBeenCalled()
})

test('lists only the subsets of that exact game, never the game itself', async () => {
  ;(getGameList as jest.Mock).mockResolvedValue(LIST)
  const res = await GET(request(QUERY))
  expect((res as unknown as { data: { ID: number }[] }).data.map((g) => g.ID)).toEqual([2, 3])
  expect((withCache as jest.Mock).mock.calls[0][0]).toBe('gameList_v1:7')
})

test('an empty list when RA fails', async () => {
  ;(getGameList as jest.Mock).mockRejectedValue(new Error('RA down'))
  const res = await GET(request(QUERY))
  expect(res.status).toBe(200)
  expect((res as unknown as { data: unknown }).data).toEqual([])
})
