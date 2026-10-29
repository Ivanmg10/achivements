jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/rankings', () => ({ loadRanking: jest.fn(), weekStartRanks: jest.fn() }))

import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { loadRanking, weekStartRanks } from '@/lib/rankings'
import { GET } from './route'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '4', admin: false } })
  ;(loadRanking as jest.Mock).mockResolvedValue([{ id: 4, totalPoints: 1200, split: { ra: 1200 }, rank: 12, listed: true }])
  ;(weekStartRanks as jest.Mock).mockResolvedValue(new Map([[4, 19]]))
  query.mockImplementation(async (sql: string) => {
    if (sql.includes('FROM users')) return { rows: [{ show_in_rankings: true, profile_public: false, score_refreshed_at: '2026-10-20T10:00:00Z' }] }
    if (sql.includes('to_timestamp')) return { rows: [{ start: '2026-10-20', points: 15 }] }
    if (sql.includes('to_char')) return { rows: [{ start: '2026-10-12', points: 880 }] }
    if (sql.includes('score_periods')) return { rows: [{ kind: 'w', points: 40 }, { kind: 'm', points: 300 }] }
    return { rows: [{ n: 3 }] }
  })
})

test('your points, place, week and month, and whether others see you', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-21T10:00:00Z'))
  const res = (await GET()) as unknown as { data: Record<string, unknown> }
  jest.useRealTimers()
  const weeks = res.data.weeks as { start: string; points: number }[]
  const days = res.data.days as { start: string; points: number }[]
  // Twelve weeks ending with this one, zeros where nothing was earned.
  expect(weeks).toHaveLength(12)
  expect(weeks.slice(-2)).toEqual([{ start: '2026-10-12', points: 880 }, { start: '2026-10-19', points: 0 }])
  expect(days).toHaveLength(7)
  expect(days.slice(-2)).toEqual([{ start: '2026-10-20', points: 15 }, { start: '2026-10-21', points: 0 }])
  expect({ ...res.data, weeks: undefined, days: undefined }).toEqual({
    points: 1200, split: { ra: 1200 }, week: 40, month: 300, rank: 12, rankDelta: 7,
    // A private profile is not listed, whatever the switch says.
    listed: false, showInRankings: true, provisional: 3, refreshedAt: '2026-10-20T10:00:00.000Z', weeks: undefined, days: undefined,
  })
})

test('nothing scored yet is all zeros', async () => {
  ;(loadRanking as jest.Mock).mockResolvedValue([])
  const res = (await GET()) as unknown as { data: Record<string, unknown> }
  expect(res.data).toMatchObject({ points: 0, rank: 0, split: {} })
})

test('signed out is a 401; a failure a 500', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await GET()).status).toBe(401)
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '4' } })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(loadRanking as jest.Mock).mockRejectedValue(new Error('db'))
  expect((await GET()).status).toBe(500)
})
