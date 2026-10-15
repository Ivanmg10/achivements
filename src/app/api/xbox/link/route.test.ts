jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))
jest.mock('@/lib/xboxClient', () => ({
  ...jest.requireActual('@/lib/xboxClient'),
  xboxConfigured: jest.fn(() => true),
  findXboxAccount: jest.fn(),
  xboxSummary: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { forgetUser } from '@/lib/userRecord'
import { XboxError, findXboxAccount, xboxConfigured, xboxSummary } from '@/lib/xboxClient'
import { xboxProfileFixture } from '@/test-utils/xboxFixtures'

const post = (body: unknown) =>
  new NextRequest('http://localhost/api/xbox/link', { method: 'POST', body: JSON.stringify(body) }) as unknown as Request

async function call(body: unknown) {
  const res = await POST(post(body))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true } })
  ;(xboxConfigured as jest.Mock).mockReturnValue(true)
  ;(findXboxAccount as jest.Mock).mockResolvedValue(xboxProfileFixture())
  ;(xboxSummary as jest.Mock).mockResolvedValue({})
  ;(pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call({ gamertag: 'TestPlayer' })).status).toBe(401)
})

test('403 for anyone who is not an admin, and Xbox is never asked', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: false } })
  expect(await call({ gamertag: 'TestPlayer' })).toEqual({ status: 403, body: { error: 'forbidden' } })
  expect(findXboxAccount).not.toHaveBeenCalled()
  expect(pool.query).not.toHaveBeenCalled()
})

test('503 when the server has no OpenXBL key', async () => {
  ;(xboxConfigured as jest.Mock).mockReturnValue(false)
  expect(await call({ gamertag: 'TestPlayer' })).toEqual({ status: 503, body: { error: 'not-configured' } })
})

test.each([[{}], [{ gamertag: '' }], [{ gamertag: 'x'.repeat(16) }], [{ gamertag: '../etc' }], [{ gamertag: 3 }]])(
  '400 for a gamertag Xbox would not allow: %j',
  async (body) => {
    expect(await call(body)).toEqual({ status: 400, body: { error: 'invalid-gamertag' } })
    expect(findXboxAccount).not.toHaveBeenCalled()
  },
)

test('400 for a body that is not JSON', async () => {
  const res = await POST(new NextRequest('http://localhost/api/xbox/link', { method: 'POST', body: 'nope' }) as unknown as Request)
  expect(res.status).toBe(400)
})

test('404 when no account has that gamertag', async () => {
  ;(findXboxAccount as jest.Mock).mockResolvedValue(null)
  expect(await call({ gamertag: 'TestPlayer' })).toEqual({ status: 404, body: { error: 'not-found' } })
  expect(pool.query).not.toHaveBeenCalled()
})

test('403 when the profile hides its games, and nothing is saved', async () => {
  ;(xboxSummary as jest.Mock).mockRejectedValue(new XboxError('private', 'hidden'))
  expect(await call({ gamertag: 'TestPlayer' })).toEqual({ status: 403, body: { error: 'private' } })
  expect(pool.query).not.toHaveBeenCalled()
})

test('502 when Xbox fails otherwise', async () => {
  ;(findXboxAccount as jest.Mock).mockRejectedValue(new Error('network'))
  expect(await call({ gamertag: 'TestPlayer' })).toEqual({ status: 502, body: { error: 'failed' } })
})

test('500 when the save fails', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect(await call({ gamertag: 'TestPlayer' })).toEqual({ status: 500, body: { error: 'failed' } })
  expect(forgetUser).not.toHaveBeenCalled()
})

test('saves the account as Xbox spells it and drops the cached user row', async () => {
  expect(await call({ gamertag: ' testplayer ' })).toEqual({
    status: 200,
    body: { xboxxuid: '2535400000000001', xboxgamertag: 'TestPlayer' },
  })
  expect(findXboxAccount).toHaveBeenCalledWith(' testplayer ')
  expect(xboxSummary).toHaveBeenCalledWith('2535400000000001', 'TestPlayer', '7')
  expect(pool.query).toHaveBeenCalledWith('UPDATE users SET xboxxuid = $1, xboxgamertag = $2 WHERE id = $3', [
    '2535400000000001',
    'TestPlayer',
    '7',
  ])
  expect(forgetUser).toHaveBeenCalledWith('7')
})
