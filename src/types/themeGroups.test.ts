import { THEMES, THEME_GROUPS } from './types'

test('every theme sits in exactly one picker group', () => {
  const grouped = THEME_GROUPS.flatMap((g) => g.themes)
  expect([...grouped].sort()).toEqual([...THEMES].sort())
  expect(new Set(grouped).size).toBe(grouped.length)
})
