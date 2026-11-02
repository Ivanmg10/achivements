jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { wantsFresh } from '@/lib/wantsFresh'
import { readCache, readCacheMany, writeCache, withSteamCache, clearUserCache, sweepExpired, TTL } from './steamCache'

jest.mock('@/lib/wantsFresh', () => ({ MIN_REFRESH_AGE_MS: 60000, wantsFresh: jest.fn() }))

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  query.mockReset()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  ;(console.error as jest.Mock).mockRestore()
  jest.useRealTimers()
})

describe('readCache', () => {
  test('returns the stored payload on a live hit', async () => {
    query.mockResolvedValue({ rows: [{ cache_data: { a: 1 } }] })
    await expect(readCache('k')).resolves.toEqual({ a: 1 })
    // Expiry is filtered in SQL, so an expired row never comes back as a hit.
    expect(query.mock.calls[0][0]).toContain('expires_at > NOW()')
  })

  test('returns null on a miss', async () => {
    query.mockResolvedValue({ rows: [] })
    await expect(readCache('k')).resolves.toBeNull()
  })

  test('degrades to a miss when the DB is down rather than throwing', async () => {
    query.mockRejectedValue(new Error('db down'))
    await expect(readCache('k')).resolves.toBeNull()
  })

  test('redacts Xbox account and title ids from cache error logs', async () => {
    query.mockRejectedValue(new Error('db down'))
    await readCache('xbox:account:v2:PersonalGamertag')
    await readCache('xbox:titles:v7:2535400000000001')

    const output = (console.error as jest.Mock).mock.calls.flat().join(' ')
    expect(output).not.toContain('PersonalGamertag')
    expect(output).not.toContain('2535400000000001')
    expect(output).toContain('xbox:account:v2')
    expect(output).toContain('xbox:titles:v7')
  })
})

describe('writeCache', () => {
  test('upserts with the TTL and user id', async () => {
    query.mockResolvedValue({})
    await writeCache('k', { a: 1 }, 5000, '7')

    const [sql, params] = query.mock.calls[0]
    expect(sql).toContain('ON CONFLICT (cache_key) DO UPDATE')
    expect(params).toEqual(['k', '7', JSON.stringify({ a: 1 }), '5000'])
  })

  test('defaults to a global entry with no user id', async () => {
    query.mockResolvedValue({})
    await writeCache('schema:730', { a: 1 }, 5000)
    expect(query.mock.calls[0][1][1]).toBeNull()
  })

  test('swallows a write failure', async () => {
    query.mockRejectedValue(new Error('db down'))
    await expect(writeCache('k', {}, 1)).resolves.toBeUndefined()
  })
})

describe('withSteamCache', () => {
  test('serves a hit without calling the fetcher', async () => {
    query.mockResolvedValue({ rows: [{ cache_data: { cached: true } }] })
    const fetcher = jest.fn()

    await expect(withSteamCache('k', 1000, fetcher)).resolves.toEqual({ cached: true })
    expect(fetcher).not.toHaveBeenCalled()
  })

  test('fetches and stores on a miss', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({})
    const fetcher = jest.fn().mockResolvedValue({ fresh: true })

    await expect(withSteamCache('k', 1000, fetcher, { userId: '7' })).resolves.toEqual({ fresh: true })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(query.mock.calls[1][0]).toContain('INSERT INTO steam_cache')
  })

  test('does not store a payload shouldCache rejects', async () => {
    query.mockResolvedValue({ rows: [] })
    const fetcher = jest.fn().mockResolvedValue({ success: false })

    await expect(
      withSteamCache('k', 1000, fetcher, { shouldCache: (d: { success: boolean }) => d.success }),
    ).resolves.toEqual({ success: false })

    expect(query.mock.calls.some((c) => String(c[0]).includes('INSERT'))).toBe(false)
  })

  test('collapses concurrent misses into one upstream call', async () => {
    query.mockResolvedValue({ rows: [] })
    let resolve!: (v: unknown) => void
    const fetcher = jest.fn().mockReturnValue(new Promise((r) => { resolve = r }))

    const a = withSteamCache('same', 1000, fetcher)
    const b = withSteamCache('same', 1000, fetcher)
    resolve({ v: 1 })

    await expect(a).resolves.toEqual({ v: 1 })
    await expect(b).resolves.toEqual({ v: 1 })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('releases the in-flight slot after a failure so the next call retries', async () => {
    query.mockResolvedValue({ rows: [] })
    const fetcher = jest.fn().mockRejectedValueOnce(new Error('steam down')).mockResolvedValueOnce({ ok: 1 })

    await expect(withSteamCache('k', 1000, fetcher)).rejects.toThrow('steam down')
    await expect(withSteamCache('k', 1000, fetcher)).resolves.toEqual({ ok: 1 })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  test('serves an expired successful value for an allowed failure and marks it stale', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ cache_data: { old: true } }] })
    const onEvent = jest.fn()
    const fetcher = jest.fn().mockRejectedValue(new Error('upstream down'))

    await expect(withSteamCache('stale-basic', 1000, fetcher, { staleIfError: () => true, onEvent })).resolves.toEqual({ old: true })
    expect(query.mock.calls[1][0]).not.toContain('expires_at > NOW()')
    expect(query.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO steam_cache'))).toBe(false)
    expect(onEvent).toHaveBeenCalledWith('stale')
  })

  test('does not read or serve stale data when the failure is excluded', async () => {
    query.mockResolvedValue({ rows: [] })
    const fetcher = jest.fn().mockRejectedValue(new Error('private'))

    await expect(withSteamCache('stale-excluded', 1000, fetcher, { staleIfError: () => false })).rejects.toThrow('private')
    expect(query).toHaveBeenCalledTimes(1)
  })

  test('a shared or backed-off stale result still obeys each caller failure policy', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ cache_data: 'old' }] })
    let reject!: (err: Error) => void
    const fetcher = jest.fn().mockReturnValue(new Promise((_resolve, r) => { reject = r }))
    const allowed = withSteamCache('mixed-stale', 1000, fetcher, { staleIfError: () => true })
    const refused = withSteamCache('mixed-stale', 1000, fetcher, { staleIfError: () => false })
    const settled = Promise.allSettled([allowed, refused])
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    reject(new Error('rate-limited'))

    await expect(settled).resolves.toEqual([
      { status: 'fulfilled', value: 'old' },
      { status: 'rejected', reason: new Error('rate-limited') },
    ])
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ cache_data: 'old' }] })
    await expect(withSteamCache('mixed-stale', 1000, fetcher, { staleIfError: () => false })).rejects.toThrow('rate-limited')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('backs off retries for 60 seconds after serving stale data', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-30T12:00:00Z'))
    query.mockImplementation((sql: string) => Promise.resolve({ rows: sql.includes('SELECT cache_data FROM steam_cache WHERE cache_key = $1 AND expires_at') ? [] : [{ cache_data: 'old' }] }))
    const fetcher = jest.fn().mockRejectedValue(new Error('down'))
    const options = { staleIfError: () => true }

    await expect(withSteamCache('stale-backoff', 1000, fetcher, options)).resolves.toBe('old')
    await expect(withSteamCache('stale-backoff', 1000, fetcher, options)).resolves.toBe('old')
    expect(fetcher).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(61_000)
    await expect(withSteamCache('stale-backoff', 1000, fetcher, options)).resolves.toBe('old')
    expect(fetcher).toHaveBeenCalledTimes(2)
    jest.useRealTimers()
  })

  test('a nested stale result is not written as fresh and is shared as stale', async () => {
    query.mockResolvedValue({ rows: [] })
    const onEvent = jest.fn()

    await expect(withSteamCache('nested-stale', 1000, async () => 'value', { staleResult: () => true, onEvent })).resolves.toBe('value')
    expect(query.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO steam_cache'))).toBe(false)
    expect(onEvent).toHaveBeenCalledWith('stale')
  })

  test('reports a shared stale outcome to every concurrent caller', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ cache_data: 'old' }] })
    let reject!: (err: Error) => void
    const fetcher = jest.fn().mockReturnValue(new Promise((_resolve, r) => { reject = r }))
    const firstEvent = jest.fn()
    const secondEvent = jest.fn()

    const first = withSteamCache('stale-shared', 1000, fetcher, { staleIfError: () => true, onEvent: firstEvent })
    const second = withSteamCache('stale-shared', 1000, fetcher, { staleIfError: () => true, onEvent: secondEvent })
    const settled = Promise.allSettled([first, second])
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    expect(fetcher).toHaveBeenCalledTimes(1)
    reject(new Error('down'))

    await expect(settled).resolves.toEqual([{ status: 'fulfilled', value: 'old' }, { status: 'fulfilled', value: 'old' }])
    expect(firstEvent).toHaveBeenCalledWith('stale')
    expect(secondEvent).toHaveBeenCalledWith('stale')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe('clearUserCache', () => {
  test('takes RA\'s rows too, which carry the user in their key alone', async () => {
    query.mockResolvedValue({ rowCount: 1 })
    await clearUserCache('7')
    expect(query).toHaveBeenCalledWith(expect.stringContaining("cache_key ~ ('^ra:[^:]+:'"), ['7'])
  })

  test('deletes every row for the user', async () => {
    query.mockResolvedValue({ rowCount: 3 })
    await clearUserCache('7')
    expect(query).toHaveBeenCalledWith('DELETE FROM steam_cache WHERE user_id = $1', ['7'])
  })

  test('swallows a failure', async () => {
    query.mockRejectedValue(new Error('db down'))
    await expect(clearUserCache('7')).resolves.toBeUndefined()
  })
})

describe('sweepExpired', () => {
  test('reports how many rows it removed and retains Xbox stale data for 30 days', async () => {
    query.mockResolvedValue({ rowCount: 12 })
    await expect(sweepExpired()).resolves.toBe(12)
    const [sql] = query.mock.calls[0]
    expect(sql).toContain('expires_at <= NOW()')
    expect(sql).toContain("cache_key NOT LIKE 'xbox:%'")
    expect(sql).toContain("INTERVAL '30 days'")
  })

  test('treats a null rowCount as zero', async () => {
    query.mockResolvedValue({ rowCount: null })
    await expect(sweepExpired()).resolves.toBe(0)
  })

  test('lets a failure through, so the cron run reports it', async () => {
    query.mockRejectedValue(new Error('db down'))
    await expect(sweepExpired()).rejects.toThrow('db down')
  })
})

test('TTLs match how fast each endpoint changes', () => {
  expect(TTL.recentlyPlayed).toBeLessThan(TTL.profile)
  expect(TTL.profile).toBeLessThan(TTL.ownedGames)
  expect(TTL.schema).toBeGreaterThan(TTL.achievements)
})

describe('readCacheMany', () => {
  test('returns live entries for many keys in one query', async () => {
    query.mockResolvedValue({ rows: [
      { cache_key: 'a', cache_data: [1] },
      { cache_key: 'c', cache_data: [3] },
    ] })

    const found = await readCacheMany(['a', 'b', 'c'])
    expect(query).toHaveBeenCalledTimes(1)
    expect(query.mock.calls[0][0]).toContain('cache_key = ANY($1)')
    expect(query.mock.calls[0][0]).toContain('expires_at > NOW()')
    expect(query.mock.calls[0][1]).toEqual([['a', 'b', 'c']])
    expect([...found]).toEqual([['a', [1]], ['c', [3]]])
  })

  test('skips the query entirely for no keys', async () => {
    await expect(readCacheMany([])).resolves.toEqual(new Map())
    expect(query).not.toHaveBeenCalled()
  })

  test('degrades to all misses when the DB is down', async () => {
    query.mockRejectedValue(new Error('db down'))
    await expect(readCacheMany(['a'])).resolves.toEqual(new Map())
  })
})

describe('refreshing', () => {
  test('readCache with a max age also filters on when the row was written', async () => {
    query.mockResolvedValue({ rows: [] })
    await readCache('k', 60000)
    expect(query.mock.calls[0][0]).toContain('created_at >')
    expect(query.mock.calls[0][1]).toEqual(['k', '60000'])
  })

  test('readCache without one is the same query as ever', async () => {
    query.mockResolvedValue({ rows: [] })
    await readCache('k')
    expect(query.mock.calls[0][0]).not.toContain('created_at')
    expect(query.mock.calls[0][1]).toEqual(['k'])
  })

  test('a rewrite stamps the row as new, or it would look old forever', async () => {
    query.mockResolvedValue({})
    await writeCache('k', {}, 1)
    expect(query.mock.calls[0][0]).toContain('created_at = NOW()')
  })

  test('a refreshable key asked to refresh only accepts a minute-old entry', async () => {
    ;(wantsFresh as jest.Mock).mockResolvedValue(true)
    query.mockResolvedValue({ rows: [] })
    await withSteamCache('k', 1000, async () => 'x', { refreshable: true })
    expect(query.mock.calls[0][1]).toEqual(['k', '60000'])
  })

  test('a key that is not refreshable ignores the signal', async () => {
    ;(wantsFresh as jest.Mock).mockResolvedValue(true)
    query.mockResolvedValue({ rows: [] })
    await withSteamCache('k', 1000, async () => 'x')
    expect(query.mock.calls[0][1]).toEqual(['k'])
  })
})
