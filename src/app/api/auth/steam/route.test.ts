import { GET } from './route'
import { NextRequest } from 'next/server'

const BASE = 'https://www.cheevovault.com'

function start(search = '') {
  const res = GET(new NextRequest(`${BASE}/api/auth/steam${search}`))
  const steam = new URL(res.headers.get('location') as string)
  const back = new URL(steam.searchParams.get('openid.return_to') as string).searchParams
  return { res, steam, back }
}

beforeEach(() => {
  process.env.NEXTAUTH_URL = BASE
})

test('goes to Steam with a fresh state, kept in a cookie for the callback', () => {
  const { res, steam, back } = start()
  expect(steam.origin).toBe('https://steamcommunity.com')
  expect(back.get('intent')).toBe('signin')
  expect(back.get('state')).toMatch(/^[0-9a-f]{32}$/)
  expect(res.headers.get('Set-Cookie')).toContain(`steam-state=${back.get('state')}; Path=/api/auth/steam/callback`)
  expect(start().back.get('state')).not.toBe(back.get('state'))
})

test('a link carries where to come back to, only among its own pages', () => {
  expect(start('?intent=link&next=%2F').back.get('next')).toBe('/')
  expect(start('?intent=link&next=https%3A%2F%2Fevil.example').back.get('next')).toBe('/user')
  expect(start('?intent=link').back.get('intent')).toBe('link')
})
