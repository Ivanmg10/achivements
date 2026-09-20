jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { verifyState } from '@/lib/steamOpenId'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
})

function locationOf(res: { headers: Map<string, string> }) {
  return new URL(res.headers.get('location') as string)
}

test('redirects an anonymous visitor to the sign-in page', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await GET()
  expect(locationOf(res as never).pathname).toBe('/authPage')
})

test('returns 503 when NEXTAUTH_URL is not configured', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  delete process.env.NEXTAUTH_URL
  const res = await GET()
  expect((res as { status: number }).status).toBe(503)
})

test('redirects to Steam with a return_to carrying a state bound to this user', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  const res = await GET()
  const url = locationOf(res as never)

  expect(url.origin + url.pathname).toBe('https://steamcommunity.com/openid/login')
  expect(url.searchParams.get('openid.mode')).toBe('checkid_setup')
  expect(url.searchParams.get('openid.realm')).toBe('http://localhost:3000/')

  const returnTo = new URL(url.searchParams.get('openid.return_to') as string)
  expect(returnTo.pathname).toBe('/api/steam/callback')

  const state = returnTo.searchParams.get('state')
  expect(verifyState(state, '7')).toBe(true)
  expect(verifyState(state, '8')).toBe(false)
})
