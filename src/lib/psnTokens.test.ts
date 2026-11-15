jest.mock('psn-api', () => ({
  exchangeNpssoForAccessCode: jest.fn(),
  exchangeAccessCodeForAuthTokens: jest.fn(),
  exchangeRefreshTokenForAuthTokens: jest.fn(),
}))
jest.mock('@/lib/psnAccounts', () => jest.requireActual('@/test-utils/fakePsnAccounts').fakePsnStore)
jest.mock('@/lib/attemptLimit', () => ({ reserveAttempt: jest.fn(async () => ({ allowed: true, release: async () => {} })) }))
jest.mock('@/lib/upstreamCount', () => ({ countUpstream: jest.fn() }))

import * as psn from 'psn-api'
import { reserveAttempt } from '@/lib/attemptLimit'
import { fakePsnStore } from '@/test-utils/fakePsnAccounts'
import { psnCallTotals, resetPsnCallStats } from './psnCallStats'
import { AUTH_FAILED, PsnBusyError } from './psnErrors'
import { exchangeNpsso, forgetPsnAccountTokens, forgetPsnTokens, psnAccountTokens, psnAuthorization } from './psnTokens'

const mock = (fn: unknown) => fn as jest.Mock
const HOUR = 3_600_000
const DAY = 24 * HOUR
const ACCOUNT = { id: 1, label: 'PSN-1', ratePerMin: 40 }
const fresh = (accessToken: string) => ({ accessToken, refreshToken: 'refresh', expiresIn: 3600, refreshTokenExpiresIn: 864000 })

beforeEach(() => {
  jest.clearAllMocks()
  forgetPsnTokens()
  resetPsnCallStats()
  fakePsnStore.reset([{ id: 1, npsso: 'npsso-1' }])
  mock(psn.exchangeNpssoForAccessCode).mockResolvedValue('code')
  mock(psn.exchangeAccessCodeForAuthTokens).mockResolvedValue(fresh('from-npsso'))
  mock(psn.exchangeRefreshTokenForAuthTokens).mockResolvedValue(fresh('from-refresh'))
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('no tokens yet: the NPSSO signs in, counted as two auth calls on the account, and the tokens are kept', async () => {
  expect(await psnAuthorization(ACCOUNT)).toEqual({ accessToken: 'from-npsso' })
  expect(psn.exchangeNpssoForAccessCode).toHaveBeenCalledWith('npsso-1')
  expect(psnCallTotals()).toEqual({ auth: 2 })
  expect(reserveAttempt).toHaveBeenCalledWith('psn-upstream', 'account:1', 600)
  expect(fakePsnStore.accounts[0].tokens?.accessToken).toBe('from-npsso')
})

test('the tokens another instance stored are used while they have more than 10 minutes', async () => {
  fakePsnStore.accounts[0].tokens = { accessToken: 'stored', accessExpiresAt: Date.now() + 20 * 60_000, refreshToken: 'r', refreshExpiresAt: Date.now() + 9 * DAY }
  expect(await psnAuthorization(ACCOUNT)).toEqual({ accessToken: 'stored' })
  // Held by this instance from then on: no second look at the row.
  const lock = jest.spyOn(fakePsnStore, 'lockPsnTokens')
  await psnAuthorization(ACCOUNT)
  expect(lock).not.toHaveBeenCalled()
  expect(psnCallTotals()).toEqual({})
})

test('at ~50 minutes the access token is refreshed, keeping the refresh deadline Sony set', async () => {
  const deadline = Date.now() + 9 * DAY
  fakePsnStore.accounts[0].tokens = { accessToken: 'old', accessExpiresAt: Date.now() + 5 * 60_000, refreshToken: 'r', refreshExpiresAt: deadline }
  const t = await psnAccountTokens(ACCOUNT)
  expect(t).toMatchObject({ accessToken: 'from-refresh', refreshExpiresAt: deadline })
  expect(psn.exchangeNpssoForAccessCode).not.toHaveBeenCalled()
})

test('at ~7 days the refresh token is replaced by a new sign-in with the NPSSO', async () => {
  fakePsnStore.accounts[0].tokens = { accessToken: 'old', accessExpiresAt: Date.now() - 1, refreshToken: 'r', refreshExpiresAt: Date.now() + 2 * DAY }
  expect((await psnAccountTokens(ACCOUNT)).accessToken).toBe('from-npsso')
  expect(psn.exchangeRefreshTokenForAuthTokens).not.toHaveBeenCalled()
})

test('a failed refresh falls back to the NPSSO', async () => {
  fakePsnStore.accounts[0].tokens = { accessToken: 'old', accessExpiresAt: Date.now() - 1, refreshToken: 'r', refreshExpiresAt: Date.now() + 9 * DAY }
  mock(psn.exchangeRefreshTokenForAuthTokens).mockResolvedValue({ error: 'invalid_grant' })
  expect((await psnAccountTokens(ACCOUNT)).accessToken).toBe('from-npsso')
})

test('an NPSSO Sony refuses quarantines the account', async () => {
  mock(psn.exchangeNpssoForAccessCode).mockRejectedValue(new Error('There was a problem retrieving your PSN access code. Is your NPSSO code valid?'))
  await expect(psnAuthorization(ACCOUNT)).rejects.toMatchObject({ code: AUTH_FAILED })
  expect(fakePsnStore.accounts[0].status).toBe('quarantined')
})

test('Sony out of reach is not a refusal: the account stays active', async () => {
  mock(psn.exchangeNpssoForAccessCode).mockRejectedValue(new TypeError('fetch failed'))
  await expect(psnAuthorization(ACCOUNT)).rejects.toBeInstanceOf(TypeError)
  expect(fakePsnStore.accounts[0].status).toBe('active')
})

test('no NPSSO at all is a refused sign-in', async () => {
  fakePsnStore.reset([{ id: 1, npsso: null }])
  await expect(psnAuthorization(ACCOUNT)).rejects.toMatchObject({ code: AUTH_FAILED })
})

test("the account's budget spent stops a refresh before Sony is asked", async () => {
  fakePsnStore.accounts[0].tokens = { accessToken: 'old', accessExpiresAt: Date.now() - 1, refreshToken: 'r', refreshExpiresAt: Date.now() + 9 * DAY }
  mock(reserveAttempt).mockResolvedValue({ allowed: false, release: async () => {} })
  await expect(psnAuthorization(ACCOUNT)).rejects.toBeInstanceOf(PsnBusyError)
  expect(psn.exchangeRefreshTokenForAuthTokens).not.toHaveBeenCalled()
  mock(reserveAttempt).mockResolvedValue({ allowed: true, release: async () => {} })
})

test('two calls at once on one instance refresh once', async () => {
  await Promise.all([psnAuthorization(ACCOUNT), psnAuthorization(ACCOUNT)])
  expect(psn.exchangeNpssoForAccessCode).toHaveBeenCalledTimes(1)
})

test('a refused access token is forgotten here and in the row', async () => {
  await psnAuthorization(ACCOUNT)
  await forgetPsnAccountTokens(1)
  expect(fakePsnStore.accounts[0].tokens).toBeNull()
  await psnAuthorization(ACCOUNT)
  expect(psn.exchangeNpssoForAccessCode).toHaveBeenCalledTimes(2)
})

test('testing an NPSSO with no account yet is counted but takes no budget', async () => {
  expect((await exchangeNpsso('candidate')).accessToken).toBe('from-npsso')
  expect(psnCallTotals()).toEqual({ auth: 2 })
  expect(reserveAttempt).not.toHaveBeenCalled()
  mock(psn.exchangeAccessCodeForAuthTokens).mockResolvedValue({})
  await expect(exchangeNpsso('candidate')).rejects.toMatchObject({ code: AUTH_FAILED })
})
