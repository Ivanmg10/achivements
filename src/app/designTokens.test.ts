import { THEMES } from '@/types/types'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const css: string = require('fs').readFileSync(require('path').join(__dirname, 'globals.css'), 'utf8').replace(/\r\n/g, '\n')

const DESIGN_TOKENS = [
  '--hardcore', '--softcore',
  '--slant-button', '--slant-pill', '--slant-line', '--slant-mark', '--slant-cut',
  '--clip-3', '--clip-4', '--clip-5', '--clip-6', '--clip-8', '--clip-14', '--clip-fill', '--bar-radius',
  '--r-chip', '--r-control', '--r-field', '--r-card',
  '--h-control-sm', '--h-control', '--h-field',
  '--motion-hover', '--motion-open', '--motion-indicator', '--ease-spring',
]

/** The block every theme inherits from (`:root, [data-theme] { … }`). */
function baseBlock() {
  const start = css.indexOf(':root,\n[data-theme] {')
  return css.slice(start, css.indexOf('}', start))
}

test('the base block defines every design token, so every theme has them', () => {
  const base = baseBlock()
  for (const token of DESIGN_TOKENS) expect(base).toContain(`${token}:`)
})

/** The one block that may change the shapes: the round design (`:root[data-shape="round"] { … }`). */
function roundBlock() {
  const start = css.indexOf(':root[data-shape="round"] {')
  return css.slice(start, css.indexOf('}', start))
}

test('no theme overrides the shapes: only the round design does, for all themes at once', () => {
  const round = roundBlock()
  for (const token of DESIGN_TOKENS.filter((t) => !['--hardcore', '--softcore'].includes(t))) {
    const inRound = round.includes(`${token}:`) ? 1 : 0
    expect(css.split(`${token}:`).length - 1).toBe(1 + inRound)
  }
})

test('the round design takes the slant out of every slanted token', () => {
  const round = roundBlock()
  for (const token of ['--slant-button', '--slant-pill', '--slant-line', '--slant-mark', '--slant-cut']) expect(round).toContain(`${token}: 0deg`)
  for (const token of ['--clip-3', '--clip-4', '--clip-5', '--clip-6', '--clip-8', '--clip-14', '--clip-fill']) expect(round).toContain(`${token}: none`)
})

test('light surfaces get darker RA marks', () => {
  const start = css.indexOf('/* Light surfaces: the RA marks')
  const block = css.slice(start, css.indexOf('}', start))
  for (const theme of ['light', 'light-red', 'light-green', 'sakura', 'arctic']) {
    expect(THEMES).toContain(theme)
    expect(block).toContain(`[data-theme="${theme}"]`)
  }
  expect(block).toContain('--hardcore:')
  expect(block).toContain('--softcore:')
})

test('Tailwind sees the colours and radii', () => {
  for (const name of ['--color-hardcore', '--color-softcore', '--radius-chip', '--radius-control', '--radius-field', '--radius-card']) {
    expect(css).toContain(`${name}:`)
  }
})
