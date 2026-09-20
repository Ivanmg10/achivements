jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { readCache, writeCache, withSteamCache, clearUserCache, sweepExpired, TTL } from './steamCache'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  ;(console.error as jest.Mock).mockRestore()
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
})

describe('clearUserCache', () => {
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
  test('reports how many rows it removed', async () => {
    query.mockResolvedValue({ rowCount: 12 })
    await expect(sweepExpired()).resolves.toBe(12)
  })

  test('treats a null rowCount as zero', async () => {
    query.mockResolvedValue({ rowCount: null })
    await expect(sweepExpired()).resolves.toBe(0)
  })

  test('returns 0 on failure', async () => {
    query.mockRejectedValue(new Error('db down'))
    await expect(sweepExpired()).resolves.toBe(0)
  })
})

test('TTLs match how fast each endpoint changes', () => {
  expect(TTL.recentlyPlayed).toBeLessThan(TTL.profile)
  expect(TTL.profile).toBeLessThan(TTL.ownedGames)
  expect(TTL.schema).toBeGreaterThan(TTL.achievements)
})
