jest.mock('psn-api', () => ({ getProfileFromAccountId: jest.fn(), getUserTrophyProfileSummary: jest.fn() }))
jest.mock('@/lib/psnAccounts', () => ({
  canaryDue: jest.fn(async () => []),
  npssoExpiry: jest.fn(),
  recordPsnCanary: jest.fn(async () => {}),
}))
jest.mock('@/lib/psnTokens', () => ({
  exchangeNpsso: jest.fn(),
  forgetPsnAccountTokens: jest.fn(async () => {}),
  psnAuthorization: jest.fn(async () => ({ accessToken: 'stored' })),
}))
jest.mock('@/lib/psnBudget', () => ({ spendPsnCall: jest.fn(async () => {}) }))

import * as psn from 'psn-api'
import { canaryDue, npssoExpiry, recordPsnCanary } from '@/lib/psnAccounts'
import { exchangeNpsso, forgetPsnAccountTokens } from '@/lib/psnTokens'
import { spendPsnCall } from '@/lib/psnBudget'
import { AUTH_FAILED, PsnError } from './psnErrors'
import { checkPsnAccount, runPsnCanaries, tryPsnNpsso } from './psnAccountCheck'

const mock = (fn: unknown) => fn as jest.Mock
const ACCOUNT = { id: 2, label: 'PSN-2', ratePerMin: 40 }
const TOKENS = { accessToken: 'new', accessExpiresAt: 1, refreshToken: 'r', refreshExpiresAt: 2 }
const NPSSO = 'n'.repeat(64)

beforeEach(() => {
  jest.clearAllMocks()
  mock(psn.getUserTrophyProfileSummary).mockResolvedValue({ accountId: '9001' })
  mock(psn.getProfileFromAccountId).mockResolvedValue({ onlineId: 'ServiceTwo', avatars: [{ size: 'xl', url: 'http://img/a.png' }] })
  mock(npssoExpiry).mockResolvedValue(5_000)
  mock(exchangeNpsso).mockResolvedValue(TOKENS)
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('an NPSSO that works: its expiry, its tokens, and who it signs in as (its own profile)', async () => {
  expect(await tryPsnNpsso(NPSSO)).toEqual({ npsso: NPSSO, expiresAt: 5_000, tokens: TOKENS, onlineId: 'ServiceTwo', avatarUrl: 'https://img/a.png' })
  expect(mock(psn.getUserTrophyProfileSummary).mock.calls[0]).toEqual([{ accessToken: 'new' }, 'me'])
  expect(mock(psn.getProfileFromAccountId).mock.calls[0][1]).toBe('9001')
})

test('an NPSSO Sony does not know, or whose sign-in is refused, is rejected; Sony out of reach is a failure', async () => {
  mock(npssoExpiry).mockResolvedValueOnce(null)
  expect(await tryPsnNpsso(NPSSO)).toBe('rejected')
  mock(exchangeNpsso).mockRejectedValueOnce(new PsnError('refused', AUTH_FAILED))
  expect(await tryPsnNpsso(NPSSO)).toBe('rejected')
  mock(psn.getUserTrophyProfileSummary).mockResolvedValueOnce({ error: { code: 500, message: 'Internal' } })
  expect(await tryPsnNpsso(NPSSO)).toBe('failed')
  expect(JSON.stringify(mock(console.error).mock.calls)).not.toContain(NPSSO)
})

test('the canary reads the account its own profile within its budget, and records who it is', async () => {
  const check = await checkPsnAccount(ACCOUNT)
  expect(check).toMatchObject({ ok: true, profile: { onlineId: 'ServiceTwo' } })
  expect(spendPsnCall).toHaveBeenCalledWith(ACCOUNT, 'summary')
  expect(spendPsnCall).toHaveBeenCalledWith(ACCOUNT, 'profile')
  expect(recordPsnCanary).toHaveBeenCalledWith(2, { onlineId: 'ServiceTwo', avatarUrl: 'https://img/a.png' })
})

test('a failed canary is recorded; a refused token is dropped; a 429 says so', async () => {
  mock(psn.getUserTrophyProfileSummary).mockResolvedValueOnce({ error: { code: 1, message: 'Invalid token' } })
  expect(await checkPsnAccount(ACCOUNT)).toEqual({ ok: false, error: 'auth' })
  expect(forgetPsnAccountTokens).toHaveBeenCalledWith(2)
  expect(recordPsnCanary).toHaveBeenLastCalledWith(2, null)
  mock(psn.getUserTrophyProfileSummary).mockResolvedValueOnce({ error: { code: 2138635, message: 'Rate limit exceeded' } })
  expect(await checkPsnAccount(ACCOUNT)).toEqual({ ok: false, error: 'rate-limited' })
})

test('Sony that never answers ends at the deadline', async () => {
  jest.useFakeTimers()
  mock(psn.getUserTrophyProfileSummary).mockReturnValueOnce(new Promise(() => {}))
  const pending = checkPsnAccount(ACCOUNT)
  await jest.advanceTimersByTimeAsync(8_000)
  expect(await pending).toEqual({ ok: false, error: 'failed' })
  jest.useRealTimers()
})

test('the due canaries run two accounts at a time, with a pause between', async () => {
  jest.useFakeTimers()
  mock(canaryDue).mockResolvedValue([1, 2, 3].map((id) => ({ ...ACCOUNT, id })))
  const pending = runPsnCanaries()
  await jest.advanceTimersByTimeAsync(0)
  expect(recordPsnCanary).toHaveBeenCalledTimes(2)
  await jest.advanceTimersByTimeAsync(2_000)
  expect(await pending).toBe(3)
  expect(recordPsnCanary).toHaveBeenCalledTimes(3)
  jest.useRealTimers()
})
