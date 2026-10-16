jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn() }))
jest.mock('@/lib/xboxClient', () => ({
  ...jest.requireActual('@/lib/xboxClient'),
  xboxLatestAchievements: jest.fn(),
  xboxRecentAchievements: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { getServerSession } from 'next-auth'
import { XboxError, xboxLatestAchievements, xboxRecentAchievements } from '@/lib/xboxClient'
import { xboxRecentFixture } from '@/test-utils/xboxFixtures'

const FEED = [xboxRecentFixture()]

async function call(qs = '') {
  const res = await GET(new NextRequest(`http://localhost/api/xbox/recentAchievements?${qs}`))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true, xboxxuid: '25354', xboxgamertag: 'TestPlayer' } })
  ;(xboxLatestAchievements as jest.Mock).mockResolvedValue(FEED)
  ;(xboxRecentAchievements as jest.Mock).mockResolvedValue(FEED)
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in, 403 for a non-admin', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValueOnce(null)
  expect((await call()).status).toBe(401)
  ;(getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: '7', xboxxuid: '25354', xboxgamertag: 'x' } })
  expect((await call()).status).toBe(403)
})

test('no scope means the latest few, in the language asked', async () => {
  expect(await call('lang=es')).toEqual({ status: 200, body: FEED })
  expect(xboxLatestAchievements).toHaveBeenCalledWith('25354', '7', 'es-ES')
})

test('activity looks back 60 days and year 366', async () => {
  await call('scope=activity')
  expect(xboxRecentAchievements).toHaveBeenCalledWith('25354', 'activity', 60, '7', 'en-US')
  await call('scope=year&lang=de')
  expect(xboxRecentAchievements).toHaveBeenCalledWith('25354', 'year', 366, '7', 'de-DE')
})

test('400 for a scope that does not exist', async () => {
  expect(await call('scope=forever')).toEqual({ status: 400, body: { error: 'invalid-scope' } })
  expect(xboxLatestAchievements).not.toHaveBeenCalled()
  expect(xboxRecentAchievements).not.toHaveBeenCalled()
})

test('failures are structured', async () => {
  ;(xboxRecentAchievements as jest.Mock).mockRejectedValueOnce(new XboxError('rate-limited', 'x'))
  expect((await call('scope=year')).status).toBe(429)
  ;(xboxLatestAchievements as jest.Mock).mockRejectedValueOnce(new Error('boom'))
  expect((await call()).status).toBe(502)
})

test('the browser may keep the answer for 2 minutes, privately, and a new session cookie asks again', async () => {
  const res = await GET(new NextRequest('http://localhost/api/xbox/recentAchievements'))
  expect(res.status).toBe(200)
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=120')
  expect(res.headers.get('Vary')).toBe('Cookie')
})
