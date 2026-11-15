/** @jest-environment node */
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { appSecret, cookieFromHeader, cronRefusal, hmacHex, sameHex, sameText } from './secrets'
import { open } from './secretBox'
import { raKeyHash, readRaKey } from './raKey'
import { signElevation } from './adminAuth'
import { signVerification } from './emailVerification'
import { signTicket } from './steamLogin'

const SECRET = 'pinned-secret-119'
const AT = 1800000000000

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = SECRET
  delete process.env.CRON_SECRET
})

// Made with the code from before #119. If one of these changes, what is stored with it
// (sealed RA keys, the NPSSO, TOTP secrets, `raid_hash`) or out in the wild (links,
// tickets, unlock cookies) stops being readable.
describe('the derivations stay what they were', () => {
  test('sealed values made before still open', () => {
    expect(open('Te-TXioxneFFASAG.5jKMb2EYGAf5ApTxKwadSw.cqSuRRsVCVGcpbc', 'psn-npsso')).toBe('npsso-value')
    expect(readRaKey('plh4rBYL2CcIMKKR.dLvbrz5gl5rkzooVG2iKyg.Gaoxk7HwFtDl')).toBe('my-ra-key')
  })

  test('the RA key hash', () => {
    expect(raKeyHash('my-ra-key')).toBe('8c6824eb0eeb5a35ed543f530fc6f61b43d9410b7809be82e51ebeaf3c3eb301')
  })

  test('the signed tokens', () => {
    expect(signElevation('7', 'pwv1', AT)).toBe(
      '7.pwv1.1800000000000.19368f512447326f7ceb517a006afb8638ab05b71d8f52d435352ac49aa80eb5',
    )
    expect(signVerification(7, 'A@B.com', AT)).toBe(
      'Ny5hQGIuY29tLjE4MDAwMDAwMDAwMDA.aa0e06004762ca3e04158a8863d8ef626da6d4a69e13ca87394340ef93a1bbfa',
    )
    expect(signTicket('76561197960287930', AT)).toBe(
      '76561197960287930.1800000000000.ad66480c4792161390f04d25d5a1040ae59d9227d32d2672ea5b40d5539f872b',
    )
  })
})

test('appSecret refuses to run without NEXTAUTH_SECRET', () => {
  delete process.env.NEXTAUTH_SECRET
  expect(() => appSecret()).toThrow('NEXTAUTH_SECRET is not configured')
  expect(() => hmacHex('x')).toThrow()
})

test('hmacHex takes a derived key when given one', () => {
  expect(hmacHex('x')).not.toBe(hmacHex('x', `${SECRET}:other`))
})

test('sameHex and sameText compare whole values only', () => {
  const sig = hmacHex('payload')
  expect(sameHex(sig, sig)).toBe(true)
  expect(sameHex(sig.slice(0, -2), sig)).toBe(false)
  expect(sameHex('zz', sig)).toBe(false)
  expect(sameText('Bearer a', 'Bearer a')).toBe(true)
  expect(sameText('Bearer ab', 'Bearer a')).toBe(false)
})

test('cookieFromHeader finds one cookie among several', () => {
  expect(cookieFromHeader('a=1; admin-elevation=x%2Ey; b=2', 'admin-elevation')).toBe('x.y')
  expect(cookieFromHeader('a=1; steam-state=abc', 'steam-state')).toBe('abc')
  expect(cookieFromHeader(null, 'steam-state')).toBeNull()
  expect(cookieFromHeader('steam-stateX=1', 'steam-state')).toBeNull()
})

describe('cronRefusal', () => {
  const req = (authorization?: string) =>
    new Request('https://x.test/api/cron', { headers: authorization ? { authorization } : {} })

  test('refuses everyone without CRON_SECRET', () => {
    expect(cronRefusal(req('Bearer s'))?.status).toBe(503)
  })

  test('refuses a wrong or missing bearer, lets the cron in', () => {
    process.env.CRON_SECRET = 's'
    expect(cronRefusal(req())?.status).toBe(401)
    expect(cronRefusal(req('Bearer t'))?.status).toBe(401)
    expect(cronRefusal(req('Bearer s'))).toBeNull()
  })
})
