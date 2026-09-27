import { scheduleRetry } from './fetchWithRetry'

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
