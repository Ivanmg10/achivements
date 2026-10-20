jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/rankings', () => ({
  ...jest.requireActual('@/lib/rankings'),
  loadRanking: jest.fn(),
  presenceOf: jest.fn(),
  weekStartRanks: jest.fn(),
}))

import { getServerSession } from 'next-auth'
import { GET } from './route'
import { loadRanking, presenceOf, weekStartRanks, type RankEntry } from '@/lib/rankings'

const entry = (id: number, rank: number, points: number, listed = true): RankEntry => ({
  id, username: `u${id}`, avatar: null, points, totalPoints: points, split: { ra: points }, completed: 1, achievements: 10, rank, listed,
})
const get = (qs = '') => GET({ url: `http://x/api/rankings${qs}` } as Request) as unknown as Promise<{ status: number; data: Record<string, unknown> }>

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  ;(loadRanking as jest.Mock).mockResolvedValue([entry(1, 1, 900), entry(2, 2, 500), entry(3, 3, 100)])
  ;(presenceOf as jest.Mock).mockResolvedValue(new Map([[1, { online: true, lastSeenAt: null }]]))
  ;(weekStartRanks as jest.Mock).mockResolvedValue(new Map([[1, 2], [2, 1]]))
})

test('signed out: the global list, with arrows, no presence and no ids', async () => {
  const res = await get()
  expect(res.status).toBe(200)
  const rows = res.data.rows as Record<string, unknown>[]
  expect(rows.map((r) => [r.username, r.rank, r.delta])).toEqual([['u1', 1, 1], ['u2', 2, -1], ['u3', 3, null]])
  expect(rows[0]).not.toHaveProperty('id')
  expect(rows[0]).not.toHaveProperty('online')
  expect(res.data.me).toBeNull()
  expect(presenceOf).not.toHaveBeenCalled()
  expect(loadRanking).toHaveBeenCalledWith({ scope: 'global', period: 'all', source: 'all', viewerId: null, xbox: false })
})

test('signed in: the viewer, who is close, and presence for the others', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '2' } })
  const res = await get('?scope=following')
  expect(res.data.me).toMatchObject({ username: 'u2', isMe: true, listed: true, rank: 2 })
  expect((res.data.near as { username: string }[]).map((r) => r.username)).toEqual(['u1', 'u3'])
  expect((res.data.rows as Record<string, unknown>[])[0]).toMatchObject({ online: true })
  expect(presenceOf).toHaveBeenCalledWith([1, 3])
  // Arrows only on the global, all-time view of every platform.
  expect(res.data.arrows).toBe(false)
})

test('an unlisted viewer sees where they would be, but no one sees them', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '9' } })
  ;(loadRanking as jest.Mock).mockResolvedValue([entry(1, 1, 900), entry(2, 2, 500), entry(9, 2, 600, false)])
  const res = await get()
  expect(res.data.total).toBe(2)
  expect((res.data.rows as unknown[]).length).toBe(2)
  expect(res.data.me).toMatchObject({ username: 'u9', listed: false, rank: 2 })
})

test('refuses what it does not know, Following signed out, and Xbox to non-admins', async () => {
  expect((await get('?period=year')).status).toBe(400)
  expect((await get('?offset=-1')).status).toBe(400)
  expect((await get('?scope=following')).status).toBe(401)
  expect((await get('?source=xbox')).status).toBe(403)
})

test('a failure is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(loadRanking as jest.Mock).mockRejectedValue(new Error('db'))
  expect((await get()).status).toBe(500)
})
