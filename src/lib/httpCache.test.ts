import { cachedJson } from './httpCache'

test('sets a private Cache-Control header with max-age derived from the TTL', () => {
  const res = cachedJson({ id: 1 }, 5 * 60 * 1000)
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=300')
  expect((res as unknown as { data: unknown }).data).toEqual({ id: 1 })
})

test('rounds down fractional seconds', () => {
  const res = cachedJson({}, 1500)
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=1')
})

test('never emits a negative max-age', () => {
  const res = cachedJson({}, -1000)
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=0')
})
