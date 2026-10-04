import { daysBetween, formatDay } from './utils'

test('every day of a range, both ends included, across a month boundary', () => {
  expect(daysBetween('2026-05-30', '2026-06-02')).toEqual(['2026-05-30', '2026-05-31', '2026-06-01', '2026-06-02'])
  expect(daysBetween('2026-06-02', '2026-06-02')).toEqual(['2026-06-02'])
})

test('a day is formatted in the language asked for, without slipping to the day before', () => {
  expect(formatDay('2026-06-05', 'en', { day: 'numeric', month: 'short' })).toBe('Jun 5')
  expect(formatDay('2026-06-05', 'es', { day: 'numeric', month: 'long' })).toBe('5 de junio')
})
