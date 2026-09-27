jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { verifyState } from '@/lib/steamOpenId'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
})

const linkRequest = (origin = 'http://localhost:3000') => ({ url: `${origin}/api/steam/link` }) as Request

function locationOf(res: { headers: Map<string, string> }) {
  return new URL(res.headers.get('location') as string)
}

test('redirects an anonymous visitor to the sign-in page', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await GET(linkRequest())
  expect(locationOf(res as never).pathname).toBe('/authPage')
})

test('returns 503 when NEXTAUTH_URL is not configured', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  delete process.env.NEXTAUTH_URL
  const res = await GET(linkRequest())
  expect((res as { status: number }).status).toBe(503)
})

test('redirects to Steam with a return_to carrying a state bound to this user', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  const res = await GET(linkRequest())
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

describe('on a preview deployment, where NEXTAUTH_URL points at production', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_URL = 'https://achivements-pi.vercel.app'
    process.env.VERCEL_BRANCH_URL = 'achivements-git-feature-x.vercel.app'
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  })
  afterEach(() => delete process.env.VERCEL_BRANCH_URL)

  test('Steam is sent back to the preview the visitor left from, where their session cookie lives', async () => {
    const url = locationOf((await GET(linkRequest('https://achivements-git-feature-x.vercel.app'))) as never)
    expect(url.searchParams.get('openid.realm')).toBe('https://achivements-git-feature-x.vercel.app/')
    expect(new URL(url.searchParams.get('openid.return_to') as string).origin).toBe(
      'https://achivements-git-feature-x.vercel.app',
    )
  })

  test('a host that is not one of the project’s own is ignored', async () => {
    const url = locationOf((await GET(linkRequest('https://evil.example'))) as never)
    expect(new URL(url.searchParams.get('openid.return_to') as string).origin).toBe('https://achivements-pi.vercel.app')
  })
})
