global.fetch = jest.fn()

import { fetchRA } from './fetchRA'

beforeEach(() => {
  ;(fetch as jest.Mock).mockReset()
})

test('returns parsed JSON on a successful response', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) })
  const result = await fetchRA('https://retroachievements.org/API/x.php')
  expect(result).toEqual({ id: 1 })
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('does not retry a 4xx response — throws immediately with the status', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
  await expect(fetchRA('https://retroachievements.org/API/x.php')).rejects.toMatchObject({ status: 404 })
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('retries a 500 response up to the attempt limit, then throws', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
  await expect(fetchRA('https://retroachievements.org/API/x.php')).rejects.toMatchObject({ status: 500 })
  expect(fetch).toHaveBeenCalledTimes(3)
}, 10_000)

test('recovers on a later attempt after a transient failure', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 2 }) })

  const result = await fetchRA('https://retroachievements.org/API/x.php')
  expect(result).toEqual({ id: 2 })
  expect(fetch).toHaveBeenCalledTimes(2)
}, 10_000)

test('retries a network error, not just HTTP error statuses', async () => {
  ;(fetch as jest.Mock)
    .mockRejectedValueOnce(new Error('network down'))
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 3 }) })

  const result = await fetchRA('https://retroachievements.org/API/x.php')
  expect(result).toEqual({ id: 3 })
  expect(fetch).toHaveBeenCalledTimes(2)
}, 10_000)
