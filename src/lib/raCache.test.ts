import { withCache, clearCache, MAX_CACHE_ENTRIES } from './raCache'
import { readCache, writeCache } from './steamCache'
import { wantsFresh } from './wantsFresh'

jest.mock('./steamCache', () => ({
  readCache: jest.fn(),
  writeCache: jest.fn(),
}))

jest.mock('./wantsFresh', () => ({ MIN_REFRESH_AGE_MS: 60000, wantsFresh: jest.fn() }))

beforeEach(() => {
  ;(wantsFresh as jest.Mock).mockReset().mockResolvedValue(false)
  clearCache()
  ;(readCache as jest.Mock).mockReset().mockResolvedValue(null)
  ;(writeCache as jest.Mock).mockReset().mockResolvedValue(undefined)
})

test('a shared (database) hit skips the fetcher and is then served from memory', async () => {
  ;(readCache as jest.Mock).mockResolvedValueOnce({ id: 9 })
  const fetcher = jest.fn().mockResolvedValue({ id: 1 })
  expect(await withCache('key', 5000, fetcher)).toEqual({ id: 9 })
  expect(await withCache('key', 5000, fetcher)).toEqual({ id: 9 })
  expect(fetcher).not.toHaveBeenCalled()
  expect(readCache).toHaveBeenCalledTimes(1)
  expect(readCache).toHaveBeenCalledWith('ra:key', undefined)
})

test('a fetched value is written to the shared cache with its TTL', async () => {
  await withCache('key', 5000, jest.fn().mockResolvedValue({ id: 1 }))
  expect(writeCache).toHaveBeenCalledWith('ra:key', { id: 1 }, 5000)
})

test('a value that fails shouldCache is not written to the shared cache', async () => {
  await withCache('key', 5000, jest.fn().mockResolvedValue({ bad: true }), () => false).catch(() => {})
  expect(writeCache).not.toHaveBeenCalled()
})

test('fetches and returns data on cache miss', async () => {
  const fetcher = jest.fn().mockResolvedValue({ id: 1 })
  const result = await withCache('key', 5000, fetcher)
  expect(result).toEqual({ id: 1 })
  expect(fetcher).toHaveBeenCalledTimes(1)
})

test('returns cached data without calling fetcher again on hit', async () => {
  const fetcher = jest.fn().mockResolvedValue({ id: 1 })
  await withCache('key', 5000, fetcher)
  const result = await withCache('key', 5000, fetcher)
  expect(result).toEqual({ id: 1 })
  expect(fetcher).toHaveBeenCalledTimes(1)
})

test('refetches after TTL expires', async () => {
  jest.useFakeTimers()
  const fetcher = jest.fn().mockResolvedValue({ id: 1 })
  await withCache('key', 100, fetcher)
  jest.advanceTimersByTime(200)
  await withCache('key', 100, fetcher)
  expect(fetcher).toHaveBeenCalledTimes(2)
  jest.useRealTimers()
})

test('different keys are cached independently', async () => {
  const fetcherA = jest.fn().mockResolvedValue('a')
  const fetcherB = jest.fn().mockResolvedValue('b')
  const a = await withCache('keyA', 5000, fetcherA)
  const b = await withCache('keyB', 5000, fetcherB)
  expect(a).toBe('a')
  expect(b).toBe('b')
  expect(fetcherA).toHaveBeenCalledTimes(1)
  expect(fetcherB).toHaveBeenCalledTimes(1)
})

test('clearCache forces refetch', async () => {
  const fetcher = jest.fn().mockResolvedValue({ id: 1 })
  await withCache('key', 5000, fetcher)
  clearCache()
  await withCache('key', 5000, fetcher)
  expect(fetcher).toHaveBeenCalledTimes(2)
})

test('throws RA_VALIDATION_FAILED when shouldCache returns false', async () => {
  const fetcher = jest.fn().mockResolvedValue({ bad: true })
  await expect(
    withCache('key', 5000, fetcher, (d) => typeof d === 'object' && d !== null && 'id' in d),
  ).rejects.toMatchObject({ message: 'RA_VALIDATION_FAILED' })
})

test('does not cache data when shouldCache returns false', async () => {
  const fetcher = jest.fn().mockResolvedValue({ bad: true })
  await withCache('key', 5000, fetcher, () => false).catch(() => {})
  await withCache('key', 5000, fetcher, () => false).catch(() => {})
  expect(fetcher).toHaveBeenCalledTimes(2)
})

test('caches data when shouldCache returns true', async () => {
  const fetcher = jest.fn().mockResolvedValue({ id: 1 })
  await withCache('key', 5000, fetcher, (d) => typeof d === 'object' && d !== null && 'id' in d)
  await withCache('key', 5000, fetcher, (d) => typeof d === 'object' && d !== null && 'id' in d)
  expect(fetcher).toHaveBeenCalledTimes(1)
})

test('evicts the oldest entries once the cache grows past MAX_CACHE_ENTRIES', async () => {
  const fetcher = jest.fn().mockResolvedValue({ id: 1 })
  for (let i = 0; i < MAX_CACHE_ENTRIES + 10; i++) {
    await withCache(`key-${i}`, 5000, fetcher)
  }

  // The store never grows past the cap...
  const stillCached = await withCache(`key-${MAX_CACHE_ENTRIES + 9}`, 5000, fetcher)
  expect(stillCached).toEqual({ id: 1 })
  const callsBeforeOldestCheck = fetcher.mock.calls.length

  // ...and the oldest entries were the ones dropped, so they refetch.
  await withCache('key-0', 5000, fetcher)
  expect(fetcher.mock.calls.length).toBe(callsBeforeOldestCheck + 1)
})

describe('refreshing', () => {
  const REFRESHABLE = { refreshable: true }
  afterEach(() => jest.useRealTimers())

  test('an entry older than a minute is fetched again when the refresh button asked', async () => {
    jest.useFakeTimers()
    const fetcher = jest.fn().mockResolvedValue({ id: 1 })
    await withCache('key', 600000, fetcher, undefined, REFRESHABLE)
    jest.advanceTimersByTime(61000)
    ;(wantsFresh as jest.Mock).mockResolvedValue(true)
    await withCache('key', 600000, fetcher, undefined, REFRESHABLE)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  test('an entry under a minute old is kept: that is the rate limit', async () => {
    jest.useFakeTimers()
    const fetcher = jest.fn().mockResolvedValue({ id: 1 })
    await withCache('key', 600000, fetcher, undefined, REFRESHABLE)
    jest.advanceTimersByTime(30000)
    ;(wantsFresh as jest.Mock).mockResolvedValue(true)
    await withCache('key', 600000, fetcher, undefined, REFRESHABLE)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('without the signal an old entry is still served', async () => {
    jest.useFakeTimers()
    const fetcher = jest.fn().mockResolvedValue({ id: 1 })
    await withCache('key', 600000, fetcher, undefined, REFRESHABLE)
    jest.advanceTimersByTime(120000)
    await withCache('key', 600000, fetcher, undefined, REFRESHABLE)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('a key that is not refreshable ignores the signal', async () => {
    jest.useFakeTimers()
    const fetcher = jest.fn().mockResolvedValue({ id: 1 })
    ;(wantsFresh as jest.Mock).mockResolvedValue(true)
    await withCache('key', 600000, fetcher)
    jest.advanceTimersByTime(120000)
    await withCache('key', 600000, fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('the shared cache is asked for a minute-old entry at most', async () => {
    ;(wantsFresh as jest.Mock).mockResolvedValue(true)
    await withCache('key', 5000, jest.fn().mockResolvedValue({ id: 1 }), undefined, REFRESHABLE)
    expect(readCache).toHaveBeenCalledWith('ra:key', 60000)
  })
})
