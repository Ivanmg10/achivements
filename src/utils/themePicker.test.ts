import { THEMES } from '@/types/types'
import { ACCENTS, BASES, NAMED_THEMES, pairOf, pickAccent, pickBase, themeFor } from './themePicker'

const offered = BASES.flatMap((base) => ACCENTS.map((accent) => themeFor(base, accent)).filter((t) => t !== null))
const named = NAMED_THEMES.map((n) => n.id)

test('each basic theme comes from exactly one pair, and every pair offered is a theme', () => {
  expect(offered).toHaveLength(14)
  expect(new Set(offered).size).toBe(14)
  for (const id of offered) expect(THEMES).toContain(id)
})

test('every theme is either one pair or one named theme, none twice and none left out', () => {
  expect([...offered, ...named].sort()).toEqual([...THEMES].sort())
  expect(named.filter((id) => offered.includes(id))).toEqual([])
})

test('the drawn table: tinted has no white or black, and each id keeps its pair', () => {
  expect(themeFor('dark', 'mono')).toBe('dark-white')
  expect(themeFor('light', 'mono')).toBe('light-black')
  expect(themeFor('tinted', 'violet')).toBe('purple')
  expect(themeFor('tinted', 'mono')).toBeNull()
  for (const id of offered) expect(themeFor(pairOf(id)!.base, pairOf(id)!.accent)).toBe(id)
  for (const id of named) expect(pairOf(id)).toBeNull()
})

test('a base keeps the accent it can, else violet; an accent lands on the base that is on, or dark', () => {
  expect(pickBase('light', 'red')).toBe('light-red')
  expect(pickBase('tinted', 'mono')).toBe('purple')
  expect(pickBase('dark', undefined)).toBe('dark')
  expect(pickAccent('tinted', 'green')).toBe('green')
  expect(pickAccent('tinted', 'mono')).toBeNull()
  expect(pickAccent(undefined, 'mono')).toBe('dark-white')
})
