/**
 * @jest-environment node
 */
import { steamFailure } from './steamFailure'

test('a rate limit stays one, and says when to come back', () => {
  const res = steamFailure({ status: 429 })
  expect(res.status).toBe(429)
  expect(res.headers.get('Retry-After')).toBe('60')
})

test('anything else is Steam being unavailable', () => {
  expect(steamFailure(new Error('down')).status).toBe(503)
  expect(steamFailure({ status: 500 }, 'Steam store unavailable').status).toBe(503)
})
