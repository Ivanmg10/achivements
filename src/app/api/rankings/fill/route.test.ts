jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))
jest.mock('@/lib/scoreRefresh', () => ({ continueFill: jest.fn(), readFillStatus: jest.fn() }))

import { requireSession } from '@/lib/apiAuth'
import { continueFill, readFillStatus } from '@/lib/scoreRefresh'
import { GET, POST } from './route'

const STATUS = { complete: false, running: true, points: 10, updatedAt: '2026-10-20T10:00:00Z', platforms: { ra: { read: 3, total: 9, state: 'reading' } } }

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '7' })
})

test('GET reads where the fill stands, POST runs the next pass', async () => {
  ;(readFillStatus as jest.Mock).mockResolvedValue(STATUS)
  expect(((await GET()) as unknown as { data: unknown }).data).toEqual(STATUS)
  expect(readFillStatus).toHaveBeenCalledWith(7)

  ;(continueFill as jest.Mock).mockResolvedValue({ ...STATUS, complete: true, running: false })
  expect(((await POST()) as unknown as { data: { complete: boolean } }).data.complete).toBe(true)
  expect(continueFill).toHaveBeenCalledWith(7, 90_000)
})

test('signed out is refused; a failure is a 500', async () => {
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: false, response: { status: 401 } })
  expect((await GET()).status).toBe(401)
  expect((await POST()).status).toBe(401)

  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '7' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(continueFill as jest.Mock).mockRejectedValue(new Error('db'))
  expect((await POST()).status).toBe(500)
})
