import { THEMES } from './types'

test('every theme has its colours in globals.css', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const css: string = require('fs').readFileSync(require('path').join(__dirname, '../app/globals.css'), 'utf8')
  for (const theme of THEMES) expect(css).toContain(`[data-theme="${theme}"]`)
})

test('a removed theme is gone from the list and from the stylesheet', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const css: string = require('fs').readFileSync(require('path').join(__dirname, '../app/globals.css'), 'utf8')
  for (const theme of ['synthwave', 'catppuccin', 'rose-pine', 'oled', 'ocean', 'terminal', 'daxter', 'bentley', 'clank', 'gruvbox', 'san-andreas']) {
    expect(THEMES).not.toContain(theme)
    expect(css).not.toContain(`[data-theme="${theme}"]`)
  }
})
