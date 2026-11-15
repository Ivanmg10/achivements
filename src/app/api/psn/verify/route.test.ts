jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))
jest.mock('@/lib/rankings', () => ({ markRankingVisibilityChanged: jest.fn(async () => {}) }))
jest.mock('@/lib/attemptLimit', () => ({ reserveAttempt: jest.fn() }))
jest.mock('@/lib/psnClient', () => ({ ...jest.requireActual('@/lib/psnClient'), psnAboutMe: jest.fn() }))

import { DELETE, GET, POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { reserveAttempt } from '@/lib/attemptLimit'
import { forgetUser } from '@/lib/userRecord'
import { markRankingVisibilityChanged } from '@/lib/rankings'
import { psnAboutMe, PsnError } from '@/lib/psnClient'

type Res = { status: number; headers: Map<string, string>; data: Record<string, unknown> }
const call = async (handler: () => Promise<Response>) => (await handler()) as unknown as Res

const HOUR = 3_600_000
const query = pool.query as jest.Mock
const release = jest.fn(async () => {})

type Row = { psnaccountid: string | null; verified: boolean; code: string | null; expiresAt: string | null }
let row: Row
/** Whether the unique index would refuse the verifying UPDATE, and whether another user already holds the account. */
let indexRefuses: boolean
let held: boolean

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', psnaccountid: '42' } })
  ;(reserveAttempt as jest.Mock).mockResolvedValue({ allowed: true, release })
  ;(psnAboutMe as jest.Mock).mockResolvedValue('hi CV-ABCD2345')
  row = { psnaccountid: '42', verified: false, code: 'CV-ABCD2345', expiresAt: new Date(Date.now() + HOUR).toISOString() }
  indexRefuses = false
  held = false
  query.mockImplementation(async (sql: string, values: unknown[]) => {
    if (/^\s*SELECT psnaccountid/.test(sql)) return { rows: [row] }
    if (/SELECT 1 FROM users/.test(sql)) return { rowCount: held ? 1 : 0 }
    if (/SET psn_verified_at = NOW\(\)/.test(sql)) {
      if (indexRefuses) throw Object.assign(new Error('duplicate key'), { code: '23505' })
      return { rowCount: values[2] === row.code ? 1 : 0 }
    }
    if (/SET psn_verification_code = \$2/.test(sql)) {
      row = { ...row, code: values[1] as string, expiresAt: (values[2] as Date).toISOString() }
      return { rowCount: 1 }
    }
    return { rowCount: 1 }
  })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

describe.each([['GET', GET], ['POST', POST], ['DELETE', DELETE]] as const)('%s', (_name, handler) => {
  test('401 when not signed in', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect((await call(handler)).status).toBe(401)
  })

  test('400 without a linked PSN account', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
    expect(await call(handler)).toMatchObject({ status: 400, data: { error: 'not-linked' } })
  })
})

describe('GET', () => {
  test('gives the stored code while it lives, never cached', async () => {
    const res = await call(GET)
    expect(res).toMatchObject({ status: 200, data: { verified: false, code: 'CV-ABCD2345' } })
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(query.mock.calls.some(([sql]) => /SET psn_verification_code/.test(sql))).toBe(false)
  })

  test('makes a code, valid for a day, when there is none', async () => {
    row = { ...row, code: null, expiresAt: null }
    const res = await call(GET)
    expect(res.data.code).toMatch(/^CV-[A-Z2-9]{8}$/)
    const left = new Date(res.data.expiresAt as string).getTime() - Date.now()
    expect(left).toBeGreaterThan(23 * HOUR)
    expect(left).toBeLessThanOrEqual(24 * HOUR)
  })

  test('replaces an expired code', async () => {
    row = { ...row, expiresAt: new Date(Date.now() - 1000).toISOString() }
    expect((await call(GET)).data.code).not.toBe('CV-ABCD2345')
  })

  test('a verified account has no code to give', async () => {
    row = { ...row, verified: true }
    expect((await call(GET)).data).toEqual({ verified: true, code: null, expiresAt: null })
  })

  test('500 when the database fails', async () => {
    query.mockRejectedValue(new Error('down'))
    expect((await call(GET)).status).toBe(500)
  })
})

describe('POST', () => {
  test('an account already verified is answered without asking Sony', async () => {
    row = { ...row, verified: true }
    expect(await call(POST)).toMatchObject({ status: 200, data: { verified: true } })
    expect(psnAboutMe).not.toHaveBeenCalled()
  })

  test.each([
    [null, null],
    ['CV-ABCD2345', new Date(Date.now() - 1000).toISOString()],
  ])('409 no-code without a living code (%s)', async (code, expiresAt) => {
    row = { ...row, code, expiresAt }
    expect(await call(POST)).toMatchObject({ status: 409, data: { error: 'no-code' } })
    expect(psnAboutMe).not.toHaveBeenCalled()
  })

  test('409 taken when another user already holds this account verified, before asking Sony', async () => {
    held = true
    expect(await call(POST)).toMatchObject({ status: 409, data: { error: 'taken' } })
    expect(psnAboutMe).not.toHaveBeenCalled()
    expect(reserveAttempt).not.toHaveBeenCalled()
  })

  test('the race: two users verify at once and the unique index refuses the second as taken', async () => {
    indexRefuses = true
    expect(await call(POST)).toMatchObject({ status: 409, data: { error: 'taken' } })
    expect(forgetUser).not.toHaveBeenCalled()
    expect(markRankingVisibilityChanged).not.toHaveBeenCalled()
  })

  test('409 no-code when the code changed while Sony was read', async () => {
    ;(psnAboutMe as jest.Mock).mockImplementation(async () => {
      row = { ...row, code: 'CV-ZZZZ9999' }
      return 'CV-ABCD2345'
    })
    expect(await call(POST)).toMatchObject({ status: 409, data: { error: 'no-code' } })
    expect(forgetUser).not.toHaveBeenCalled()
  })

  test('429 when too many checks, without asking Sony and without counting the refusal', async () => {
    ;(reserveAttempt as jest.Mock).mockResolvedValue({ allowed: false, release })
    const res = await call(POST)
    expect(res).toMatchObject({ status: 429, data: { error: 'rate-limited' } })
    expect(release).toHaveBeenCalled()
    expect(reserveAttempt).toHaveBeenCalledWith('psn-verify', 'user:7')
    expect(psnAboutMe).not.toHaveBeenCalled()
  })

  test('422 not-found when About Me has no code; the check counts', async () => {
    ;(psnAboutMe as jest.Mock).mockResolvedValue('nothing here')
    expect(await call(POST)).toMatchObject({ status: 422, data: { error: 'not-found' } })
    expect(release).not.toHaveBeenCalled()
  })

  test('reads the account stored in the row, not the session', async () => {
    row = { ...row, psnaccountid: '99' }
    await call(POST)
    expect(psnAboutMe).toHaveBeenCalledWith('99')
  })

  test.each([
    [new PsnError('Not permitted by access control', 2240526), 403, 'private'],
    [new PsnError('Too many requests'), 429, 'rate-limited'],
    [new PsnError('no sign-in', -1), 503, 'not-configured'],
    [new Error('boom'), 502, 'failed'],
  ])('a Sony failure (%s) is %i %s and does not count against the user', async (err, status, code) => {
    ;(psnAboutMe as jest.Mock).mockRejectedValue(err)
    expect(await call(POST)).toMatchObject({ status, data: { error: code } })
    expect(release).toHaveBeenCalled()
  })

  test('success marks the account, forgets the user, refreshes the rankings and gives the check back', async () => {
    expect(await call(POST)).toMatchObject({ status: 200, data: { verified: true } })
    const [sql, values] = query.mock.calls.find(([s]) => /SET psn_verified_at = NOW\(\)/.test(s))!
    expect(sql).toMatch(/psn_verification_code = NULL, psn_verification_expires_at = NULL/)
    expect(values).toEqual(['7', '42', 'CV-ABCD2345'])
    expect(forgetUser).toHaveBeenCalledWith('7')
    expect(markRankingVisibilityChanged).toHaveBeenCalled()
    expect(release).toHaveBeenCalled()
  })

  test('a failing rankings refresh does not undo the verification', async () => {
    ;(markRankingVisibilityChanged as jest.Mock).mockRejectedValueOnce(new Error('cache down'))
    expect((await call(POST)).status).toBe(200)
  })
})

describe('DELETE', () => {
  test('clears the verification and the code, and forgets the user', async () => {
    expect(await call(DELETE)).toMatchObject({ status: 200, data: { verified: false } })
    expect(query).toHaveBeenCalledWith(expect.stringMatching(/psn_verified_at = NULL, psn_verification_code = NULL, psn_verification_expires_at = NULL/), ['7'])
    expect(forgetUser).toHaveBeenCalledWith('7')
  })

  test('500 when the write fails', async () => {
    query.mockRejectedValue(new Error('down'))
    expect((await call(DELETE)).status).toBe(500)
  })
})
