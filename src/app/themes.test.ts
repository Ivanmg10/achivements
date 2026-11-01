import { THEMES, type Theme } from '@/types/types'
import { themeAccent } from '@/utils/themeIcon'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const css: string = require('fs').readFileSync(require('path').join(__dirname, 'globals.css'), 'utf8').replace(/\r\n/g, '\n')

const BLOCK = /((?:\[data-theme="[^"]+"\],?\s*)+)\{([^}]*)\}/g

/** A theme's tokens as the browser ends up with them: the blocks that name it, in order, over the base. */
function tokens(theme: Theme) {
  const base = css.slice(css.indexOf(':root,\n[data-theme] {'))
  const found: Record<string, string> = {}
  const take = (body: string) => {
    for (const [, name, value] of body.matchAll(/(--[a-z0-9-]+): (\d+ \d+ \d+);/g)) found[name] = value
  }
  take(base.slice(0, base.indexOf('}')))
  for (const [, selectors, body] of css.matchAll(BLOCK)) {
    if (selectors.includes(`[data-theme="${theme}"]`)) take(body)
  }
  return found
}

const toHex = (rgb: string) => `#${rgb.split(' ').map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`

function luminance(rgb: string) {
  const [r, g, b] = rgb.split(' ').map((n) => Number(n) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

test('each theme\'s favicon starts from its own accent, but for Venom\'s purple logo', () => {
  for (const theme of THEMES.filter((t) => t !== 'venom')) expect(themeAccent(theme)).toBe(toHex(tokens(theme)['--accent']))
  expect(themeAccent('venom')).toBe('#8b5cf6')
  expect(toHex(tokens('venom')['--accent'])).toBe('#ece8f2')
})

test('venom keeps to the dark: every surface stays close to black', () => {
  const t = tokens('venom')
  expect(toHex(t['--bg-main'])).toBe('#0b090a')
  for (const surface of ['--bg-header', '--bg-main', '--bg-card', '--bg-tertiary']) expect(luminance(t[surface])).toBeLessThan(0.02)
})

test('steam retro takes the old client\'s own colours', () => {
  const t = tokens('steam-retro')
  expect(toHex(t['--bg-header'])).toBe('#292d23')
  expect(toHex(t['--bg-card'])).toBe('#3e4637')
  expect(toHex(t['--bg-tertiary'])).toBe('#4c5844')
  expect(toHex(t['--text-main'])).toBe('#d8ded3')
  expect(toHex(t['--accent'])).toBe('#c4b550')
})

describe.each(['venom', 'midnight', 'crimson', 'steam-retro', 'snake-eater', 'dark-blue', 'dark-white', 'light-blue', 'light-black'] as Theme[])('%s reads', (theme) => {
  const t = tokens(theme)

  test.each(['--bg-main', '--bg-card', '--bg-tertiary'])('text and secondary text on %s', (surface) => {
    expect(contrast(t['--text-main'], t[surface])).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--text-secondary'], t[surface])).toBeGreaterThanOrEqual(4.5)
  })

  test('the accent on a card, as text', () => {
    expect(contrast(t['--accent'], t['--bg-card'])).toBeGreaterThanOrEqual(4.5)
  })

  test('a primary button: the page\'s ground on the accent, and on its hover', () => {
    expect(contrast(t['--bg-main'], t['--accent'])).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--bg-main'], t['--accent-hover'])).toBeGreaterThanOrEqual(4.5)
  })

  test.each(['--success', '--warning', '--info', '--danger'])('%s on a card', (meaning) => {
    expect(contrast(t[meaning], t['--bg-card'])).toBeGreaterThanOrEqual(4.5)
  })

  test('the accent does not take the place of a colour with a meaning', () => {
    for (const meaning of ['--success', '--danger', '--info']) expect(t[meaning]).not.toBe(t['--accent'])
  })
})
