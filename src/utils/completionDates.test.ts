import { psnBaseCompletedAt, raAwardCompletedAt, validCompletionDate } from './completionDates'
import type { PsnTrophy } from '@/types/psn'

const trophy = (over: Partial<PsnTrophy>): PsnTrophy => ({
  id: 1,
  name: '',
  detail: '',
  iconUrl: null,
  type: 'bronze',
  groupId: 'default',
  hidden: false,
  earned: true,
  earnedAt: '2024-01-01T00:00:00Z',
  rarity: null,
  ...over,
})

test('an old platinum keeps its date after newer DLC trophies', () => {
  expect(psnBaseCompletedAt([
    trophy({ type: 'platinum', earnedAt: '2021-05-10T10:00:00Z' }),
    trophy({ groupId: '001', earnedAt: '2026-03-01T10:00:00Z' }),
  ])).toBe('2021-05-10T10:00:00Z')
})

test('base completion after earlier DLC uses the base platinum date', () => {
  expect(psnBaseCompletedAt([
    trophy({ groupId: '001', earnedAt: '2023-01-01T00:00:00Z' }),
    trophy({ type: 'platinum', earnedAt: '2025-02-03T00:00:00Z' }),
  ])).toBe('2025-02-03T00:00:00Z')
})

test('a no-platinum game uses the last default-group trophy only when the base group is complete', () => {
  expect(psnBaseCompletedAt([
    trophy({ id: 1, earnedAt: '2022-01-01T00:00:00Z' }),
    trophy({ id: 2, earnedAt: '2024-01-01T00:00:00Z' }),
    trophy({ id: 3, groupId: '001', earnedAt: '2026-01-01T00:00:00Z' }),
  ])).toBe('2024-01-01T00:00:00Z')
  expect(psnBaseCompletedAt([trophy({ earned: true }), trophy({ id: 2, earned: false, earnedAt: null })])).toBeNull()
})

test('missing or invalid base-completion data stays unknown', () => {
  expect(psnBaseCompletedAt([trophy({ type: 'platinum', earnedAt: null })])).toBeNull()
  expect(psnBaseCompletedAt([trophy({ earnedAt: 'not-a-date' })])).toBeNull()
  expect(psnBaseCompletedAt([])).toBeNull()
  expect(validCompletionDate(null)).toBeNull()
  expect(validCompletionDate('invalid')).toBeNull()
})

test('RA accepts only a dated mastery or completion highest award', () => {
  expect(raAwardCompletedAt({ HighestAwardKind: 'mastered', HighestAwardDate: '2020-01-01 10:00:00' })).toBe('2020-01-01 10:00:00')
  expect(raAwardCompletedAt({ HighestAwardKind: 'completed', HighestAwardDate: '2020-01-01 10:00:00' })).toBe('2020-01-01 10:00:00')
  expect(raAwardCompletedAt({ HighestAwardKind: 'beaten', HighestAwardDate: '2020-01-01 10:00:00' })).toBeNull()
  expect(raAwardCompletedAt({ HighestAwardKind: 'mastered', HighestAwardDate: null })).toBeNull()
})
