jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ ...jest.requireActual('@/lib/steamCache'), clearUserCache: jest.fn() }))
jest.mock('@/lib/steamLinkNotice', () => ({ sendSteamLinkNotice: jest.fn() }))

import { POST } from './route'
import { after } from 'next/server'
import { sendSteamLinkNotice } from '@/lib/steamLinkNotice'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { clearUserCache } from '@/lib/steamCache'

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ username: 'ana', email: 'ana@test.com' }] })
})

test('returns 401 when not signed in', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await POST()
  expect(res.status).toBe(401)
  expect(pool.query).not.toHaveBeenCalled()
})

test('clears the link and the sign-in, and tells the owner', async () => {
  const res = await POST()
  expect(res.status).toBe(200)
  expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining('SET steamid = NULL, steamusername = NULL, steam_login_id = NULL'),
    ['7'],
  )
  await Promise.all((after as unknown as { pending: Promise<unknown>[] }).pending)
  expect(sendSteamLinkNotice).toHaveBeenCalledWith({ to: 'ana@test.com', username: 'ana', linked: false })
  // The unlocks kept for the streak go with the link.
  expect(pool.query).toHaveBeenCalledWith('DELETE FROM steam_unlocks WHERE user_id = $1', ['7'])
})

test('returns 500 when the DB write fails', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  const res = await POST()
  expect(res.status).toBe(500)
})

test('drops the user cached Steam data along with the link', async () => {
  await POST()
  expect(clearUserCache).toHaveBeenCalledWith('7')
})

test('does not touch the cache when the unlink write failed', async () => {
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  await POST()
  expect(clearUserCache).not.toHaveBeenCalled()
})
