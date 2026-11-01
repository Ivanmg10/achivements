import { THEMES, THEME_GROUPS } from './types'

test('every theme sits in exactly one picker group', () => {
  const grouped = THEME_GROUPS.flatMap((g) => g.themes)
  expect([...grouped].sort()).toEqual([...THEMES].sort())
  expect(new Set(grouped).size).toBe(grouped.length)
})

test('every theme has its colours in globals.css', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const css: string = require('fs').readFileSync(require('path').join(__dirname, '../app/globals.css'), 'utf8')
  for (const theme of THEMES) expect(css).toContain(`[data-theme="${theme}"]`)
})

test('dark and light come with the same accents, first in the picker', () => {
  expect(THEME_GROUPS[0]).toEqual({ id: 'base', themes: ['dark', 'dark-red', 'dark-green', 'dark-blue', 'dark-white', 'light', 'light-red', 'light-green', 'light-blue', 'light-black'] })
})

test('a removed theme is gone from the list and from the stylesheet', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const css: string = require('fs').readFileSync(require('path').join(__dirname, '../app/globals.css'), 'utf8')
  for (const theme of ['synthwave', 'catppuccin', 'rose-pine', 'oled', 'ocean', 'terminal', 'daxter', 'bentley', 'clank', 'gruvbox', 'san-andreas']) {
    expect(THEMES).not.toContain(theme)
    expect(css).not.toContain(`[data-theme="${theme}"]`)
  }
})
