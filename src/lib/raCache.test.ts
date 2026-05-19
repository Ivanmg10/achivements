import { withCache, clearCache } from './raCache'

beforeEach(() => clearCache())

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
