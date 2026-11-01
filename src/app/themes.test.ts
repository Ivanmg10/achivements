import { THEMES, type Theme } from '@/types/types'
import { themeIconSvg } from '@/utils/themeIcon'

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

test('each theme\'s favicon uses its own accent, on its header or card', () => {
  for (const theme of THEMES) {
    const t = tokens(theme)
    const fills = themeIconSvg(theme).match(/fill="(#[0-9a-f]{6})"/g)!.map((f) => f.slice(6, -1))
    expect(fills[0] === toHex(t['--bg-header']) || fills[0] === toHex(t['--bg-card'])).toBe(true)
    expect(fills[1]).toBe(toHex(t['--accent']))
  }
})

test('venom has the colours asked for', () => {
  const t = tokens('venom')
  expect(toHex(t['--bg-main'])).toBe('#0b090a')
  expect(toHex(t['--bg-card'])).toBe('#2b1b47')
  expect(toHex(t['--text-main'])).toBe('#ffffff')
  expect(toHex(t['--accent'])).toBe('#ffffff')
})

test('san andreas takes the game\'s own HUD colours', () => {
  const t = tokens('san-andreas')
  expect(toHex(t['--bg-tertiary'])).toBe('#323c7f')
  expect(toHex(t['--text-secondary'])).toBe('#accbf1')
  expect(toHex(t['--text-main'])).toBe('#e1e1e1')
  expect(toHex(t['--accent'])).toBe('#e2c063')
})

describe.each(['venom', 'san-andreas', 'snake-eater', 'dark-blue', 'dark-white', 'light-blue', 'light-black'] as Theme[])('%s reads', (theme) => {
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
