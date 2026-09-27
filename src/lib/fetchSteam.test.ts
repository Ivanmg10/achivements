global.fetch = jest.fn()

import { fetchSteam, steamApiKey, STEAM_API_BASE } from './fetchSteam'

const URL_ = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`

beforeEach(() => {
  ;(fetch as jest.Mock).mockReset()
  delete process.env.STEAM_API_KEY
})

test('returns parsed JSON on a successful response', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ response: {} }) })
  await expect(fetchSteam(URL_)).resolves.toEqual({ response: {} })
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('does not retry a 4xx — a rate-limited 429 fails fast instead of burning the budget', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 429 })
  await expect(fetchSteam(URL_)).rejects.toMatchObject({ status: 429 })
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('does not retry a 403 (private profile)', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403 })
  await expect(fetchSteam(URL_)).rejects.toMatchObject({ status: 403 })
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('retries a 500 up to the attempt limit, then throws', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
  await expect(fetchSteam(URL_)).rejects.toMatchObject({ status: 500 })
  expect(fetch).toHaveBeenCalledTimes(3)
}, 10_000)

test('recovers on a later attempt after a transient failure', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: 1 }) })
  await expect(fetchSteam(URL_)).resolves.toEqual({ ok: 1 })
  expect(fetch).toHaveBeenCalledTimes(2)
}, 10_000)

test('retries a network error', async () => {
  ;(fetch as jest.Mock)
    .mockRejectedValueOnce(new Error('network down'))
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: 2 }) })
  await expect(fetchSteam(URL_)).resolves.toEqual({ ok: 2 })
  expect(fetch).toHaveBeenCalledTimes(2)
}, 10_000)

describe('steamApiKey', () => {
  test('returns the trimmed key when set', () => {
    process.env.STEAM_API_KEY = '  abc123  '
    expect(steamApiKey()).toBe('abc123')
  })

  test('returns null when unset or blank', () => {
    expect(steamApiKey()).toBeNull()
    process.env.STEAM_API_KEY = '   '
    expect(steamApiKey()).toBeNull()
  })
})
