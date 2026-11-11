import { THEMES, type Theme } from '@/types/types'
import { themeAccent } from '@/utils/themeIcon'
import { STREAK_TIERS } from '@/utils/streakTier'
import { contrast, luminance, mixOklab, tint } from './themeContrast'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const css: string = require('fs').readFileSync(require('path').join(__dirname, 'globals.css'), 'utf8').replace(/\r\n/g, '\n')

const BLOCK = /((?:\[data-theme="[^"]+"\],?\s*)+)\{([^}]*)\}/g
const AA = 4.5

/** A theme's tokens as the browser ends up with them: the blocks that name it, in order, over the base. */
function tokens(theme: Theme) {
  const base = css.slice(css.indexOf(':root,\n[data-theme] {'))
  const found: Record<string, string> = {}
  const take = (body: string) => {
    for (const [, name, value] of body.matchAll(/(--[a-z0-9-]+): (\d+ \d+ \d+|\d+%);/g)) found[name] = value
  }
  take(base.slice(0, base.indexOf('}')))
  for (const [, selectors, body] of css.matchAll(BLOCK)) {
    if (selectors.includes(`[data-theme="${theme}"]`)) take(body)
  }
  return found
}

const toHex = (rgb: string) => `#${rgb.split(' ').map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`

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
  expect(toHex(t['--accent'])).toBe('#e3d25d')
})

const SURFACES = ['--bg-main', '--bg-card', '--bg-tertiary']
// A tint as the components draw it: `bg-danger/10` in a Notice, `bg-accent/15` on a chosen pill, a tier's 16 % behind a streak tag.
const NOTICE_TINT = 0.1
const PILL_TINT = 0.15
const STREAK_TINT = 0.16
// The second level of text has to read as one: at least this far from the body text.
const SECOND_LEVEL = 1.3

describe.each(THEMES)('%s reads', (theme) => {
  const t = tokens(theme)
  const card = t['--bg-card']

  test.each(SURFACES)('text and secondary text on %s', (surface) => {
    expect(contrast(t['--text-main'], t[surface])).toBeGreaterThanOrEqual(AA)
    expect(contrast(t['--text-secondary'], t[surface])).toBeGreaterThanOrEqual(AA)
  })

  test('secondary text is a visible step below the body text', () => {
    expect(contrast(t['--text-main'], t['--text-secondary'])).toBeGreaterThanOrEqual(SECOND_LEVEL)
  })

  test.each(['--bg-main', '--bg-card'])('the accent on %s, as text', (surface) => {
    expect(contrast(t['--accent'], t[surface])).toBeGreaterThanOrEqual(AA)
  })

  test('accent text on its own tint: a chosen pill, a pressed icon button, a dialog\'s head icon', () => {
    expect(contrast(t['--accent'], tint(t['--accent'], PILL_TINT, card))).toBeGreaterThanOrEqual(AA)
  })

  test('a primary button: the page\'s ground on the accent, and on its hover', () => {
    expect(contrast(t['--bg-main'], t['--accent'])).toBeGreaterThanOrEqual(AA)
    expect(contrast(t['--bg-main'], t['--accent-hover'])).toBeGreaterThanOrEqual(AA)
  })

  test.each(['--success', '--warning', '--info', '--danger'])('%s on a card and on its own notice tint', (meaning) => {
    expect(contrast(t[meaning], card)).toBeGreaterThanOrEqual(AA)
    expect(contrast(t[meaning], tint(t[meaning], NOTICE_TINT, card))).toBeGreaterThanOrEqual(AA)
  })

  test.each(['--hardcore', '--softcore'])('%s on a card', (mode) => {
    expect(contrast(t[mode], card)).toBeGreaterThanOrEqual(AA)
  })

  test.each(STREAK_TIERS.filter((tier) => tier.from > 0))('the streak ink of $id on the page, a card and its own tag', (tier) => {
    const ink = mixOklab(tier.color, parseInt(t['--streak-hue']) / 100, t['--text-main'])
    expect(contrast(ink, t['--bg-main'])).toBeGreaterThanOrEqual(AA)
    expect(contrast(ink, card)).toBeGreaterThanOrEqual(AA)
    expect(contrast(ink, tint(tier.color, STREAK_TINT, card))).toBeGreaterThanOrEqual(AA)
  })

  test('the accent does not take the place of a colour with a meaning', () => {
    for (const meaning of ['--success', '--danger', '--info']) expect(t[meaning]).not.toBe(t['--accent'])
  })
})
