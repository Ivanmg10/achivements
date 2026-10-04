import { unlockSpan } from './utils'

const L = { underMinute: 'under a minute', minutes: '{n} min', hours: '{n} h', days: '{n} d', months: '{n} mo' }

test('nothing to tell with fewer than two dated unlocks', () => {
  expect(unlockSpan([], L)).toBeNull()
  expect(unlockSpan(['2026-01-01T00:00:00Z', null, undefined], L)).toBeNull()
})

test('picks the largest unit that fits, whatever the order of the dates', () => {
  expect(unlockSpan(['2026-01-01T00:00:30Z', '2026-01-01T00:00:00Z'], L)).toBe('under a minute')
  expect(unlockSpan(['2026-01-01T00:00:00Z', '2026-01-01T00:42:00Z'], L)).toBe('42 min')
  expect(unlockSpan(['2026-01-01T00:00:00Z', '2026-01-01T05:10:00Z'], L)).toBe('5 h')
  expect(unlockSpan(['2026-01-10T00:00:00Z', '2026-01-01T00:00:00Z', '2026-01-04T00:00:00Z'], L)).toBe('9 d')
  expect(unlockSpan(['2026-01-01T00:00:00Z', '2026-04-15T00:00:00Z'], L)).toBe('3 mo')
})

test('ignores dates it cannot read', () => {
  expect(unlockSpan(['nonsense', '2026-01-01T00:00:00Z', '2026-01-01T02:00:00Z'], L)).toBe('2 h')
})
