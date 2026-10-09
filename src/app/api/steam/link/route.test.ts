jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))
jest.mock('@/lib/fetchSteam', () => ({ steamApiKey: jest.fn(() => 'key') }))
jest.mock('@/lib/steamAccount', () => ({
  ...jest.requireActual('@/lib/steamAccount'),
  findSteamAccount: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { forgetUser } from '@/lib/userRecord'
import { steamApiKey } from '@/lib/fetchSteam'
import { findSteamAccount } from '@/lib/steamAccount'

const ID = '76561197960287930'

async function call(body: unknown) {
  const req = new NextRequest('http://localhost/api/steam/link', { method: 'POST', body: JSON.stringify(body) }) as unknown as Request
  const res = await POST(req)
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(steamApiKey as jest.Mock).mockReturnValue('key')
  ;(findSteamAccount as jest.Mock).mockResolvedValue({ steamid: ID, personaname: 'Gabe', isPublic: true })
  ;(pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await call({ query: 'gabe' })).status).toBe(401)
})

test('503 without a Steam API key', async () => {
  ;(steamApiKey as jest.Mock).mockReturnValue(null)
  expect(await call({ query: 'gabe' })).toEqual({ status: 503, body: { error: 'not-configured' } })
})

test('400 for something that names no Steam account', async () => {
  expect(await call({ query: 'has spaces' })).toEqual({ status: 400, body: { error: 'invalid-query' } })
  expect(findSteamAccount).not.toHaveBeenCalled()
})

test('links a custom URL name, saving the id and display name', async () => {
  expect(await call({ query: 'https://steamcommunity.com/id/gabe/' })).toEqual({ status: 200, body: { steamid: ID, steamusername: 'Gabe' } })
  expect(findSteamAccount).toHaveBeenCalledWith({ vanity: 'gabe' }, 'key')
  expect(pool.query).toHaveBeenCalledWith('UPDATE users SET steamid = $1, steamusername = $2 WHERE id = $3', [ID, 'Gabe', '7'])
  expect(forgetUser).toHaveBeenCalledWith('7')
})

test('no "already linked elsewhere" check: an account linked to another user links again', async () => {
  await call({ query: ID })
  expect((pool.query as jest.Mock).mock.calls).toHaveLength(1)
})

test('404 when Steam has no such account, 403 when it is private — nothing saved', async () => {
  ;(findSteamAccount as jest.Mock).mockResolvedValueOnce(null)
  expect(await call({ query: 'nobody' })).toEqual({ status: 404, body: { error: 'not-found' } })
  ;(findSteamAccount as jest.Mock).mockResolvedValueOnce({ steamid: ID, personaname: 'Gabe', isPublic: false })
  expect(await call({ query: 'gabe' })).toEqual({ status: 403, body: { error: 'private' } })
  expect(pool.query).not.toHaveBeenCalled()
})

test('502 when Steam cannot be reached, 500 when saving fails', async () => {
  ;(findSteamAccount as jest.Mock).mockRejectedValueOnce(new Error('down'))
  expect(await call({ query: 'gabe' })).toEqual({ status: 502, body: { error: 'failed' } })
  ;(pool.query as jest.Mock).mockRejectedValueOnce(new Error('db'))
  expect(await call({ query: 'gabe' })).toEqual({ status: 500, body: { error: 'failed' } })
})
