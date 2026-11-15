jest.mock('@/lib/steamCache', () => ({
  readCacheEntry: jest.fn(),
  readCache: jest.fn(async () => null),
  writeCache: jest.fn(async () => {}),
  takeLease: jest.fn(async () => true),
  dropLease: jest.fn(async () => {}),
}))
jest.mock('@/lib/wantsFresh', () => ({ wantsFresh: jest.fn(async () => false) }))
jest.mock('@/lib/runLater', () => ({ runLater: jest.fn() }))
jest.mock('@/lib/psnBudget', () => ({ psnBackground: (work: () => Promise<unknown>) => work() }))

import { readCache, readCacheEntry, takeLease, writeCache } from '@/lib/steamCache'
import { wantsFresh } from '@/lib/wantsFresh'
import { runLater } from '@/lib/runLater'
import { PsnBusyError, PsnError, PsnSyncing } from '@/lib/psnErrors'
import { forgetPsnPrivate, psnCached, psnSyncedAt, REFRESH_MS } from './psnCache'

const mock = (fn: unknown) => fn as jest.Mock
const MIN = 60_000
const OPTS = { accountId: '42', userId: '7' }
let n = 0
/** A key of its own per test: the module keeps in-flight fetches and retry times per key. */
const key = () => `psn:test:${++n}`
const entry = (data: unknown, ageMs: number, live: boolean) => ({ data, ageMs, live })
/** Runs what was handed to runLater, as `after` would once the answer is sent. */
const runBackground = async () => {
  for (const [task] of mock(runLater).mock.calls.splice(0)) await task()
}

beforeEach(() => {
  jest.clearAllMocks()
  mock(readCacheEntry).mockResolvedValue(null)
  mock(takeLease).mockResolvedValue(true)
  mock(wantsFresh).mockResolvedValue(false)
})

test('a live entry is the answer, and Sony is not asked', async () => {
  mock(readCacheEntry).mockResolvedValue(entry('cached', MIN, true))
  const fetch = jest.fn()
  expect(await psnCached(key(), 15 * MIN, fetch, OPTS)).toBe('cached')
  expect(fetch).not.toHaveBeenCalled()
})

test('an expired entry (up to 7 days) is the answer at once, and a fresh one is fetched in the background', async () => {
  const k = key()
  mock(readCacheEntry).mockResolvedValue(entry('old', 2 * 24 * 60 * MIN, false))
  const fetch = jest.fn(async () => 'new')
  expect(await psnCached(k, 15 * MIN, fetch, OPTS)).toBe('old')
  expect(fetch).not.toHaveBeenCalled()
  await runBackground()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(writeCache).toHaveBeenCalledWith(k, 'new', 15 * MIN, '7')
  expect(readCacheEntry).toHaveBeenCalledWith(k, 7 * 24 * 60 * MIN)
})

test('with nothing kept, it fetches now and keeps it', async () => {
  const k = key()
  expect(await psnCached(k, 15 * MIN, async () => 'fresh', OPTS)).toBe('fresh')
  expect(writeCache).toHaveBeenCalledWith(k, 'fresh', 15 * MIN, '7')
})

test("with nothing kept and `cold: 'background'`, it answers PsnSyncing and builds it after the answer", async () => {
  const fetch = jest.fn(async () => 'year')
  await expect(psnCached(key(), 15 * MIN, fetch, { ...OPTS, cold: 'background' })).rejects.toBeInstanceOf(PsnSyncing)
  expect(fetch).not.toHaveBeenCalled()
  await runBackground()
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('the refresh button reads Sony again only for an entry at least 10 minutes old', async () => {
  mock(wantsFresh).mockResolvedValue(true)
  const fetch = jest.fn(async () => 'fresh')
  mock(readCacheEntry).mockResolvedValue(entry('kept', REFRESH_MS - MIN, true))
  expect(await psnCached(key(), 15 * MIN, fetch, OPTS)).toBe('kept')
  mock(readCacheEntry).mockResolvedValue(entry('kept', REFRESH_MS, true))
  expect(await psnCached(key(), 15 * MIN, fetch, OPTS)).toBe('fresh')
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('the refresh button on what is built in the background answers what is there and rebuilds it after', async () => {
  mock(wantsFresh).mockResolvedValue(true)
  mock(readCacheEntry).mockResolvedValue(entry('year', REFRESH_MS, true))
  const fetch = jest.fn(async () => 'new year')
  expect(await psnCached(key(), 15 * MIN, fetch, { ...OPTS, cold: 'background' })).toBe('year')
  await runBackground()
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('a background fetch asked twice before it ran is done once', async () => {
  const k = key()
  mock(readCacheEntry).mockResolvedValue(entry('old', 20 * MIN, false))
  const fetch = jest.fn(async () => 'new')
  await psnCached(k, MIN, fetch, OPTS)
  await psnCached(k, MIN, fetch, OPTS)
  mock(readCacheEntry).mockResolvedValueOnce(entry('old', 20 * MIN, false)).mockResolvedValue(entry('new', 0, true))
  await runBackground()
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('a refresh Sony refuses keeps showing what was there', async () => {
  mock(wantsFresh).mockResolvedValue(true)
  mock(readCacheEntry).mockResolvedValue(entry('kept', REFRESH_MS, true))
  expect(await psnCached(key(), 15 * MIN, async () => Promise.reject(new PsnBusyError()), OPTS)).toBe('kept')
})

test('a hidden profile is remembered 10 minutes: the next visit is refused without asking Sony', async () => {
  const hidden = new PsnError('Not permitted by access control', 2240526)
  await expect(psnCached(key(), 15 * MIN, async () => Promise.reject(hidden), OPTS)).rejects.toBe(hidden)
  expect(writeCache).toHaveBeenCalledWith('psn:private:42', true, 10 * MIN)
  mock(readCache).mockResolvedValueOnce(true)
  const fetch = jest.fn()
  await expect(psnCached(key(), 15 * MIN, fetch, OPTS)).rejects.toMatchObject({ isPrivate: true })
  expect(fetch).not.toHaveBeenCalled()
  await forgetPsnPrivate('42')
  expect(writeCache).toHaveBeenLastCalledWith('psn:private:42', false, 1)
})

test('two readers on one instance share one fetch', async () => {
  const k = key()
  const fetch = jest.fn(async () => 'once')
  expect(await Promise.all([psnCached(k, MIN, fetch, OPTS), psnCached(k, MIN, fetch, OPTS)])).toEqual(['once', 'once'])
  expect(fetch).toHaveBeenCalledTimes(1)
})

describe('another instance holds the lease', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('its answer is used once written', async () => {
    mock(takeLease).mockResolvedValue(false)
    mock(readCacheEntry).mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValue(entry('theirs', 0, true))
    const fetch = jest.fn()
    const pending = psnCached(key(), MIN, fetch, OPTS)
    await jest.advanceTimersByTimeAsync(1_000)
    expect(await pending).toBe('theirs')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('busy if it takes too long', async () => {
    mock(takeLease).mockResolvedValue(false)
    const pending = psnCached(key(), MIN, jest.fn(), OPTS).catch((err: unknown) => err)
    await jest.advanceTimersByTimeAsync(9_000)
    expect(await pending).toBeInstanceOf(PsnBusyError)
  })
})

test('a background fetch that failed is not tried again at once (30 to 90 s later)', async () => {
  const k = key()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  mock(readCacheEntry).mockResolvedValue(entry('old', 20 * MIN, false))
  const fetch = jest.fn(async () => Promise.reject(new PsnBusyError()))
  await psnCached(k, MIN, fetch, OPTS)
  await runBackground()
  await psnCached(k, MIN, fetch, OPTS)
  expect(runLater).not.toHaveBeenCalled()
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('when it was fetched', async () => {
  mock(readCacheEntry).mockResolvedValue(entry('x', 3 * MIN, true))
  const at = await psnSyncedAt('psn:titles:core:v1:42')
  expect(Date.now() - (at ?? 0)).toBeGreaterThanOrEqual(3 * MIN)
  mock(readCacheEntry).mockResolvedValue(null)
  expect(await psnSyncedAt('k')).toBeNull()
})
