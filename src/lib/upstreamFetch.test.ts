global.fetch = jest.fn()

import { fetchUpstream, retryAfterMs } from './upstreamFetch'

beforeEach(() => {
  ;(fetch as jest.Mock).mockReset()
})

test('Retry-After in seconds or as a date; nothing readable is null', () => {
  expect(retryAfterMs('2')).toBe(2000)
  expect(retryAfterMs(new Date(Date.now() + 60_000).toUTCString())).toBeGreaterThan(55_000)
  expect(retryAfterMs('soon')).toBeNull()
  expect(retryAfterMs(null)).toBeNull()
})

test('without wait429 a 429 is passed up at once, named after its platform', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 429, headers: { get: () => '0' } })
  await expect(fetchUpstream('https://x.test', { platform: 'steam' })).rejects.toMatchObject({ status: 429, message: 'Steam API error 429' })
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('waits for its turn before asking, and retries a 5xx once', async () => {
  const before = jest.fn(async () => {})
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 502 })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: 1 }) })
  expect(await fetchUpstream('https://x.test', { platform: 'ra', before })).toEqual({ ok: 1 })
  expect(before).toHaveBeenCalledTimes(2)
  expect(fetch).toHaveBeenCalledTimes(2)
})
