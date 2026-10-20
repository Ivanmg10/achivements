jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))
jest.mock('@/lib/scoreRefresh', () => ({ refreshScoreIfStale: jest.fn() }))

import { POST } from './route'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { refreshScoreIfStale } from '@/lib/scoreRefresh'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '3' })
})

test('marks the signed-in user as seen now, at most once a minute', async () => {
  query.mockResolvedValue({ rowCount: 1 })
  const res = await POST()
  expect(res.status).toBe(200)
  const [sql, params] = query.mock.calls[0]
  expect(sql).toContain('last_seen_at = now()')
  expect(sql).toContain("interval '1 minute'")
  expect(params).toEqual(['3'])
})

test('refreshes the Vault Points of whoever is on the site, after answering', async () => {
  query.mockResolvedValue({ rowCount: 1 })
  await POST()
  expect(refreshScoreIfStale).toHaveBeenCalledWith('3')
})

test('signed out, nothing is written; a failure is a 500', async () => {
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: false, response: { status: 401 } })
  expect((await POST()).status).toBe(401)
  expect(query).not.toHaveBeenCalled()

  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '3' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  query.mockRejectedValue(new Error('db down'))
  expect((await POST()).status).toBe(500)
})
