import { allowSignup, clientAddress, resetSignupLimit } from './signupRateLimit'

beforeEach(() => resetSignupLimit())

test('lets an address create a few accounts, then stops it', () => {
  for (let i = 0; i < 5; i++) expect(allowSignup('1.2.3.4')).toBe(true)
  expect(allowSignup('1.2.3.4')).toBe(false)
})

test('counts each address on its own', () => {
  for (let i = 0; i < 5; i++) allowSignup('1.2.3.4')
  expect(allowSignup('5.6.7.8')).toBe(true)
})

test('forgets attempts older than an hour', () => {
  const start = Date.now()
  for (let i = 0; i < 5; i++) allowSignup('1.2.3.4', start)
  expect(allowSignup('1.2.3.4', start + 59 * 60_000)).toBe(false)
  expect(allowSignup('1.2.3.4', start + 61 * 60_000)).toBe(true)
})

describe('clientAddress', () => {
  test('takes the first address a proxy forwarded', () => {
    expect(clientAddress(new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('9.9.9.9')
  })

  test('falls back to x-real-ip, then to a placeholder', () => {
    expect(clientAddress(new Headers({ 'x-real-ip': '8.8.8.8' }))).toBe('8.8.8.8')
    expect(clientAddress(new Headers())).toBe('unknown')
  })
})
