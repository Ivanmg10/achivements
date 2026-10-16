jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn() }))
jest.mock('@/lib/xboxClient', () => ({ ...jest.requireActual('@/lib/xboxClient'), xboxSummary: jest.fn() }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { XboxError, xboxSummary } from '@/lib/xboxClient'

const SUMMARY = { gamertag: 'TestPlayer', gamerscore: 10242, achievementsUnlocked: 593, games: 135 }
const call = async () => {
  const res = await GET()
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true, xboxxuid: '25354', xboxgamertag: 'TestPlayer' } })
  ;(xboxSummary as jest.Mock).mockResolvedValue(SUMMARY)
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call()).status).toBe(401)
})

test('403 for anyone who is not an admin, even with an account linked', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', xboxxuid: '25354', xboxgamertag: 'TestPlayer' } })
  expect(await call()).toEqual({ status: 403, body: { error: 'forbidden' } })
  expect(xboxSummary).not.toHaveBeenCalled()
})

test('400 when no Xbox account is linked', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true } })
  expect(await call()).toEqual({ status: 400, body: { error: 'not-linked' } })
})

test("the linked account's headline numbers", async () => {
  expect(await call()).toEqual({ status: 200, body: SUMMARY })
  expect(xboxSummary).toHaveBeenCalledWith('25354', 'TestPlayer', '7')
})

test('a hidden profile is 403, a rate limit is 429, anything else 502', async () => {
  ;(xboxSummary as jest.Mock).mockRejectedValueOnce(new XboxError('private', 'x'))
  expect((await call()).status).toBe(403)
  ;(xboxSummary as jest.Mock).mockRejectedValueOnce(new XboxError('rate-limited', 'x'))
  expect((await call()).status).toBe(429)
  ;(xboxSummary as jest.Mock).mockRejectedValueOnce(new Error('network'))
  expect((await call()).status).toBe(502)
})

test('the browser may keep it for five minutes, privately, and a new session cookie asks again', async () => {
  const res = await GET()
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=300')
  expect(res.headers.get('Vary')).toBe('Cookie')
})
