jest.mock('@/app/api/follows/overview/route', () => ({ GET: jest.fn() }))
jest.mock('@/lib/friendCards', () => ({ loadFriendCards: jest.fn() }))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { GET as overview } from '@/app/api/follows/overview/route'
import { loadFriendCards } from '@/lib/friendCards'
import { DETAIL_LIMIT } from '@/utils/friends'

const req = (query = '') => new NextRequest(`http://localhost/api/follows/cards${query}`)
const bodyOf = (res: unknown) => (res as { data: unknown }).data
const people = (n: number) => Array.from({ length: n }, (_, i) => ({ username: `f${i}` }))

beforeEach(() => {
  jest.clearAllMocks()
  ;(loadFriendCards as jest.Mock).mockResolvedValue({ f0: { recent: [] } })
})

test('the list and the newest people\'s cards, in one answer, privately', async () => {
  ;(overview as jest.Mock).mockResolvedValue({ ok: true, json: async () => people(DETAIL_LIMIT + 2) })
  const res = await GET(req('?lang=es'))
  expect(res.status).toBe(200)
  expect(bodyOf(res)).toEqual({ friends: people(DETAIL_LIMIT + 2), details: { f0: { recent: [] } } })
  expect(res.headers.get('Cache-Control')).toBe('private, no-store')
  // Only the newest get their details read, one at a time (Xbox's budget).
  expect(loadFriendCards).toHaveBeenCalledWith('http://localhost', people(DETAIL_LIMIT), 'es', 1)
  expect(String((overview as jest.Mock).mock.calls[0][0].url)).toBe('http://localhost/api/follows/overview')
})

test('who follows you: their own list, two at a time', async () => {
  ;(overview as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] })
  await GET(req('?who=followers'))
  expect(String((overview as jest.Mock).mock.calls[0][0].url)).toBe('http://localhost/api/follows/overview?who=followers')
  expect(loadFriendCards).toHaveBeenCalledWith('http://localhost', [], 'en', 2)
})

test('the overview\'s refusal is answered as it is (signed out, a failure)', async () => {
  const refused = { ok: false, status: 401 }
  ;(overview as jest.Mock).mockResolvedValue(refused)
  expect(await GET(req())).toBe(refused)
  expect(loadFriendCards).not.toHaveBeenCalled()
})

test('an overview that is not a list is a 502 to try again', async () => {
  ;(overview as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
  const res = await GET(req())
  expect(res.status).toBe(502)
  expect(bodyOf(res)).toEqual({ error: 'failed', retryable: true })
})
