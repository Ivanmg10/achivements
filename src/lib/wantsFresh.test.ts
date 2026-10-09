jest.mock('next/headers', () => ({ cookies: jest.fn() }))

import { cookies } from 'next/headers'
import { wantsFresh } from './wantsFresh'
import { REFRESH_COOKIE } from './refreshMark'

const withCookies = (jar: Record<string, string>) =>
  (cookies as jest.Mock).mockResolvedValue({ get: (k: string) => (k in jar ? { value: jar[k] } : undefined) })

test('true when the refresh cookie is set', async () => {
  withCookies({ [REFRESH_COOKIE]: '1' })
  await expect(wantsFresh()).resolves.toBe(true)
})

test('false without it, or with any other value', async () => {
  withCookies({})
  await expect(wantsFresh()).resolves.toBe(false)
  withCookies({ [REFRESH_COOKIE]: 'yes' })
  await expect(wantsFresh()).resolves.toBe(false)
})

test('false outside a request, where there are no cookies to read', async () => {
  ;(cookies as jest.Mock).mockRejectedValue(new Error('outside a request scope'))
  await expect(wantsFresh()).resolves.toBe(false)
})
