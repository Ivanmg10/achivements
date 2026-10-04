import { plural } from './utils'
import { en } from '@/translations/en'
import { ru } from '@/translations/ru'
import { pl } from '@/translations/pl'

test('one and many in English and Spanish-like languages', () => {
  expect(plural(1, en.plurals.games, 'en')).toBe('1 game')
  expect(plural(3, en.plurals.games, 'en')).toBe('3 games')
  expect(plural(0, en.plurals.games, 'en')).toBe('0 games')
})

test('the three Slavic forms', () => {
  expect([1, 3, 5, 21].map((n) => plural(n, ru.plurals.games, 'ru'))).toEqual(['1 игра', '3 игры', '5 игр', '21 игра'])
  expect([1, 3, 5].map((n) => plural(n, pl.plurals.days, 'pl'))).toEqual(['1 dzień', '3 dni', '5 dni'])
})

test('numbers formatted for the language', () => {
  expect(plural(1549, en.plurals.achievements, 'en')).toBe('1,549 achievements')
})
