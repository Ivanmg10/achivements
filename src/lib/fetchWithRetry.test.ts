import { fetchWithRetry, scheduleRetry } from './fetchWithRetry'

function refs() {
  return { attempt: { current: 0 }, timer: { current: undefined as ReturnType<typeof setTimeout> | undefined } }
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

test('waits 3 s, then twice as long each time, capped at 30 s', () => {
  const { attempt, timer } = refs()
  const retry = jest.fn()
  const waits = [3_000, 6_000, 12_000, 24_000, 30_000]
  for (const wait of waits) {
    expect(scheduleRetry(attempt, timer, retry)).toBe(true)
    jest.advanceTimersByTime(wait - 1)
    const before = retry.mock.calls.length
    jest.advanceTimersByTime(1)
    expect(retry).toHaveBeenCalledTimes(before + 1)
  }
})

test('gives up after five background retries', () => {
  const { attempt, timer } = refs()
  for (let i = 0; i < 5; i++) expect(scheduleRetry(attempt, timer, jest.fn())).toBe(true)
  expect(scheduleRetry(attempt, timer, jest.fn())).toBe(false)
})

test('gives up at once on a 4xx, which asking again will not fix', () => {
  const { attempt, timer } = refs()
  const retry = jest.fn()
  expect(scheduleRetry(attempt, timer, retry, { status: 401 })).toBe(false)
  jest.runAllTimers()
  expect(retry).not.toHaveBeenCalled()
})

test('keeps retrying a 5xx', () => {
  const { attempt, timer } = refs()
  expect(scheduleRetry(attempt, timer, jest.fn(), { status: 503 })).toBe(true)
})

describe('fetchWithRetry', () => {
  const reply = (status: number, body: unknown = {}) => ({ ok: status < 400, status, json: () => Promise.resolve(body) })

  beforeEach(() => {
    global.fetch = jest.fn()
  })

  /** Runs the call while letting its waits between attempts pass. */
  async function settle<T>(promise: Promise<T>) {
    const result = promise.then((v) => ({ v }), (e) => ({ e }))
    await jest.runAllTimersAsync()
    return result as Promise<{ v?: T; e?: unknown }>
  }

  test('answers with the body on the first success', async () => {
    ;(fetch as jest.Mock).mockResolvedValue(reply(200, { a: 1 }))
    expect(await settle(fetchWithRetry('/api/x'))).toEqual({ v: { a: 1 } })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('tries again after a 5xx or a network error', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(reply(503))
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValue(reply(200, { ok: true }))
    expect(await settle(fetchWithRetry('/api/x'))).toEqual({ v: { ok: true } })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  test('a 4xx is final at once, with its status on the error', async () => {
    ;(fetch as jest.Mock).mockResolvedValue(reply(404))
    const { e } = await settle(fetchWithRetry('/api/x'))
    expect((e as { status: number }).status).toBe(404)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('gives up with the last error after the attempts run out', async () => {
    ;(fetch as jest.Mock).mockResolvedValue(reply(500))
    const { e } = await settle(fetchWithRetry('/api/x', 3))
    expect((e as Error).message).toBe('HTTP 500')
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
