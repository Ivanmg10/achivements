jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }))

import { middleware } from './middleware'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

const request = (path: string) => new NextRequest(`http://localhost:3000${path}`)

beforeEach(() => jest.clearAllMocks())

test('the landing and the auth page are open to anyone', async () => {
  for (const path of ['/', '/authPage']) {
    const res = await middleware(request(path))
    expect(res.status).toBe(200)
  }
  expect(getToken).not.toHaveBeenCalled()
})

test('the app needs an account: a visitor is sent to sign in', async () => {
  ;(getToken as jest.Mock).mockResolvedValue(null)
  const res = await middleware(request('/groups'))
  expect(res.status).toBe(307)
  expect(res.headers.get('location')).toBe('http://localhost:3000/authPage')
})

test('someone signed in goes where they asked', async () => {
  ;(getToken as jest.Mock).mockResolvedValue({ id: '3' })
  const res = await middleware(request('/user'))
  expect(res.status).toBe(200)
})
