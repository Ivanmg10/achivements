jest.mock('@/lib/psnAccounts', () => jest.requireActual('@/test-utils/fakePsnAccounts').fakePsnStore)
jest.mock('@/lib/psnTokens', () => ({ forgetPsnAccountTokens: jest.fn(async () => {}) }))

import { fakePsnStore } from '@/test-utils/fakePsnAccounts'
import { forgetPsnAccountTokens } from '@/lib/psnTokens'
import { AUTH_FAILED, NOT_CONFIGURED, PsnBusyError, PsnError, TIMED_OUT } from './psnErrors'
import { failureOf, psnPoolConfigured, resetPsnPoolSeed, withPsnAccount } from './psnPool'

const tooMany = () => new PsnError('Too many requests')
const refused = () => new PsnError('Invalid token')
const hidden = () => new PsnError('Not permitted by access control', 2240526)

/** A call that fails on the accounts in `failOn` with `err`, and answers with the account's label elsewhere. */
function work(failOn: Record<number, () => Error>) {
  const seen: number[] = []
  const fn = jest.fn(async (account: { id: number; label: string }) => {
    seen.push(account.id)
    const fail = failOn[account.id]
    if (fail) throw fail()
    return account.label
  })
  return { fn, seen }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useRealTimers()
  resetPsnPoolSeed()
  fakePsnStore.reset([{ id: 1 }, { id: 2 }, { id: 3 }])
})

test('what a failure says about the account', () => {
  expect(failureOf(new PsnBusyError())).toBe('busy')
  expect(failureOf(tooMany())).toBe('rate-limited')
  expect(failureOf(new PsnError('x', 2138635))).toBe('rate-limited')
  expect(failureOf(refused())).toBe('auth')
  expect(failureOf(new PsnError('x', AUTH_FAILED))).toBe('auth')
  expect(failureOf(new PsnError('late', TIMED_OUT))).toBe('server')
  expect(failureOf(new TypeError('fetch failed'))).toBe('server')
  expect(failureOf(hidden())).toBe('final')
  expect(failureOf(new PsnError('Resource not found', 2240525))).toBe('final')
})

test("a 429 on one account is invisible: the call runs on another, and the first's health records it", async () => {
  const { fn, seen } = work({ 1: tooMany })
  expect(await withPsnAccount(fn)).toBe('PSN-2')
  expect(seen).toEqual([1, 2])
  expect(fakePsnStore.accounts[0].outcomes).toEqual(['rate-limited'])
  expect(fakePsnStore.accounts[1].outcomes).toEqual(['ok'])
})

test('a 429 or a server error retries on other accounts twice at most', async () => {
  const { fn, seen } = work({ 1: tooMany, 2: () => new TypeError('fetch failed'), 3: tooMany })
  fakePsnStore.reset([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
  await expect(withPsnAccount(fn)).rejects.toMatchObject({ isRateLimited: true })
  expect(seen).toEqual([1, 2, 3])
})

test("a refused token drops that account's tokens and runs on another", async () => {
  const { fn, seen } = work({ 1: refused })
  expect(await withPsnAccount(fn)).toBe('PSN-2')
  expect(seen).toEqual([1, 2])
  expect(forgetPsnAccountTokens).toHaveBeenCalledWith(1)
  expect(fakePsnStore.accounts[0].outcomes).toEqual(['auth'])
})

test("a hidden profile is never retried: it is the profile's answer, and no fault of the account", async () => {
  const { fn, seen } = work({ 1: hidden })
  await expect(withPsnAccount(fn)).rejects.toMatchObject({ isPrivate: true })
  expect(seen).toEqual([1])
  expect(fakePsnStore.accounts[0].outcomes).toEqual(['ok'])
})

test("an account whose own budget is spent is skipped at no cost to its health", async () => {
  const { fn, seen } = work({ 1: () => new PsnBusyError() })
  expect(await withPsnAccount(fn)).toBe('PSN-2')
  expect(seen).toEqual([1, 2])
  expect(fakePsnStore.accounts[0].outcomes).toEqual([])
})

test('paused, draining, quarantined and resting accounts take no calls; none usable is busy', async () => {
  fakePsnStore.reset([
    { id: 1, status: 'paused' },
    { id: 2, status: 'draining' },
    { id: 3, status: 'quarantined' },
    { id: 4, cooldownUntil: Date.now() + 60_000 },
  ])
  const { fn } = work({})
  await expect(withPsnAccount(fn)).rejects.toBeInstanceOf(PsnBusyError)
  expect(fn).not.toHaveBeenCalled()
})

test('no account at all is not configured, after trying to take the old one in', async () => {
  fakePsnStore.reset([])
  const seed = jest.spyOn(fakePsnStore, 'seedPsnPool')
  await expect(withPsnAccount(work({}).fn)).rejects.toMatchObject({ code: NOT_CONFIGURED })
  expect(seed).toHaveBeenCalledTimes(1)
  expect(await psnPoolConfigured()).toBe(false)
})

describe('one account (today)', () => {
  beforeEach(() => {
    fakePsnStore.reset([{ id: 1 }])
    jest.useFakeTimers()
  })

  test('after a 429 it waits 2 s and asks the same account once more', async () => {
    let calls = 0
    const pending = withPsnAccount(async () => {
      if (++calls === 1) throw tooMany()
      return 'second'
    })
    await jest.advanceTimersByTimeAsync(2_000)
    await expect(pending).resolves.toBe('second')
  })

  test('two refusals in a row rest the account, and the 429 reaches the caller', async () => {
    const pending = withPsnAccount(async () => {
      throw tooMany()
    }).catch((e: unknown) => e)
    await jest.advanceTimersByTimeAsync(2_000)
    expect(await pending).toMatchObject({ isRateLimited: true })
    expect(fakePsnStore.accounts[0].cooldownUntil).toBeGreaterThan(Date.now())
  })

  test('after a refused token it signs in again at once', async () => {
    let calls = 0
    await expect(
      withPsnAccount(async () => {
        if (++calls === 1) throw refused()
        return 'again'
      }),
    ).resolves.toBe('again')
  })

  test('a server error is not retried on the same account', async () => {
    const fn = jest.fn(async () => {
      throw new PsnError('late', TIMED_OUT)
    })
    await expect(withPsnAccount(fn)).rejects.toMatchObject({ code: TIMED_OUT })
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

test('a failure to record the call does not hide its answer', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(fakePsnStore, 'finishPsnLease').mockRejectedValueOnce(new Error('db down'))
  expect(await withPsnAccount(work({}).fn)).toBe('PSN-1')
  ;(console.error as jest.Mock).mockRestore()
})

test('configured while an account has a sign-in', async () => {
  expect(await psnPoolConfigured()).toBe(true)
})
