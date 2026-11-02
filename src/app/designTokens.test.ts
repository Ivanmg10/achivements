import { THEMES } from '@/types/types'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const css: string = require('fs').readFileSync(require('path').join(__dirname, 'globals.css'), 'utf8').replace(/\r\n/g, '\n')

const DESIGN_TOKENS = [
  '--hardcore', '--softcore',
  '--slant-button', '--slant-pill', '--slant-line', '--slant-mark', '--slant-cut',
  '--clip-3', '--clip-4', '--clip-5', '--clip-6', '--clip-8', '--clip-14', '--clip-fill', '--bar-radius',
  '--r-chip', '--r-control', '--r-field', '--r-card',
  '--r-button', '--r-tag', '--r-pane', '--r-tile', '--r-track', '--r-knob', '--knob-w', '--knob-h', '--knob-shift',
  '--r-sheet', '--r-area', '--r-icon', '--r-box', '--r-box-md', '--r-box-sm', '--r-tag-sm', '--r-badge', '--r-cell', '--r-nav', '--button-inset', '--area-resize',
  '--h-control-sm', '--h-control', '--h-field',
  '--motion-hover', '--motion-open', '--motion-indicator', '--ease-spring',
]

/** The block every theme inherits from (`:root, [data-theme] { … }`). */
function baseBlock() {
  const start = css.indexOf(':root,\n[data-theme] {')
  return css.slice(start, css.indexOf('}', start))
}

test('a font preview shows its font: it takes the family, and Barlow can undo a page in another font', () => {
  for (const font of ['barlow', 'sofia', 'fira']) expect(css).toContain(`[data-font="${font}"]:not(html)`)
  expect(css).toMatch(/\[data-font\]:not\(html\) \{\s+@apply font-sans;/)
})

test('the home keeps one height for the profile through its platform tabs', () => {
  expect(css).toMatch(/\.home-fit-side:has\(\[role="tablist"\]\) \{ min-height: /)
})

test('a dialog\'s transition draws the ring and shadow of `Modal`\'s panel', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const modal: string = require('fs').readFileSync(require('path').join(__dirname, '../components/ui/Modal.tsx'), 'utf8')
  const start = css.lastIndexOf('::view-transition-image-pair(look-panel) {')
  const frame = css.slice(start, css.indexOf('}', start)).match(/@apply ([^;]+);/)![1]
  for (const name of frame.split(' ')) expect(modal).toContain(name)
})

test('the base block defines every design token, so every theme has them', () => {
  const base = baseBlock()
  for (const token of DESIGN_TOKENS) expect(base).toContain(`${token}:`)
})

/** The designs' blocks: `[data-shape="slanted"] { … }` restates the base, `[data-shape="round"] { … }` overrides it. */
function designBlock(name: 'slanted' | 'round') {
  const start = css.indexOf(`[data-shape="${name}"] {`)
  return css.slice(start, css.indexOf('}', start))
}
const SHAPE_TOKENS = DESIGN_TOKENS.filter((t) => /^--(slant|clip|bar-radius|button-inset|area-resize|r-nav|r-sheet|r-area|r-icon|r-box|r-box-md|r-box-sm|r-tag-sm|r-badge|r-cell|r-control|r-chip|r-button|r-tag|r-pane|r-tile|r-field|r-card|r-track|r-knob|knob)/.test(t))
const valueIn = (block: string, token: string) => block.match(new RegExp(`${token}: ([^;]+);`))?.[1]

test('no theme overrides the shapes: only the two designs do, for all themes at once', () => {
  const [slanted, round] = [designBlock('slanted'), designBlock('round')]
  for (const token of DESIGN_TOKENS.filter((t) => !['--hardcore', '--softcore'].includes(t))) {
    const inDesigns = (slanted.includes(`${token}:`) ? 1 : 0) + (round.includes(`${token}:`) ? 1 : 0)
    expect(css.split(`${token}:`).length - 1).toBe(1 + inDesigns)
  }
})

test('the slanted design restates the base exactly, so a specimen stays slanted inside a round page', () => {
  const base = baseBlock()
  const slanted = designBlock('slanted')
  for (const token of SHAPE_TOKENS) expect(valueIn(slanted, token)).toBe(valueIn(base, token))
})

test('the round design takes the slant out of every slanted token and rounds the controls', () => {
  const round = designBlock('round')
  for (const token of ['--slant-button', '--slant-pill', '--slant-line', '--slant-mark', '--slant-cut']) expect(round).toContain(`${token}: 0deg`)
  for (const token of ['--clip-3', '--clip-4', '--clip-5', '--clip-6', '--clip-8', '--clip-14', '--clip-fill']) expect(round).toContain(`${token}: none`)
  // A one-line control is a pill; what holds several lines keeps soft corners, or it would look deformed.
  for (const token of ['--r-chip', '--r-tag', '--r-tag-sm', '--r-badge', '--r-icon', '--r-nav', '--r-track', '--r-knob', '--r-button', '--r-field']) expect(round).toContain(`${token}: 9999px`)
  for (const token of ['--r-area', '--r-control', '--r-card', '--r-sheet']) expect(valueIn(round, token)).not.toBe('9999px')
  // The knob is a circle: as wide as it is tall.
  expect(valueIn(round, '--knob-w')).toBe(valueIn(round, '--knob-h'))
})

test('every surface is rounder in the round design than in the slanted one', () => {
  // It was the other way round for a while, and nothing failed: the round design simply looked square.
  const [slanted, round] = [designBlock('slanted'), designBlock('round')]
  const rem = (block: string, token: string) => parseFloat(valueIn(block, token) ?? '')
  for (const token of ['--r-card', '--r-sheet', '--r-pane', '--r-tile', '--r-control', '--r-area', '--r-box', '--r-box-md', '--r-box-sm']) {
    expect(rem(round, token)).toBeGreaterThan(rem(slanted, token))
  }
})

test('light surfaces get darker RA marks', () => {
  const start = css.indexOf('/* Light surfaces: the RA marks')
  const block = css.slice(start, css.indexOf('}', start))
  for (const theme of ['light', 'light-red', 'light-green', 'light-blue', 'light-black', 'sakura', 'arctic']) {
    expect(THEMES).toContain(theme)
    expect(block).toContain(`[data-theme="${theme}"]`)
  }
  expect(block).toContain('--hardcore:')
  expect(block).toContain('--softcore:')
})

const ENTER_TOKENS = ['--enter-duration', '--enter-ease', '--enter-stagger', '--enter-rise', '--enter-scale', '--enter-grow']

test('the entrances read tokens, defined once for every theme', () => {
  const base = baseBlock()
  for (const token of ENTER_TOKENS) expect(base).toContain(`${token}:`)
})

test('under reduced motion an entrance is a plain fade: nothing moves and nothing waits', () => {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce) {\n  :root')
  const block = css.slice(start, css.indexOf('}', start))
  expect(valueIn(block, '--enter-rise')).toBe('0px')
  expect(valueIn(block, '--enter-scale')).toBe('1')
  expect(valueIn(block, '--enter-grow')).toBe('1')
  expect(valueIn(block, '--enter-stagger')).toBe('0ms')
})

test('a slower entrance never reaches reduced motion: it would undo the 200 ms fade', () => {
  expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\n  \.enter-slow \{/)
  expect(css.match(/\.enter-slow/g)).toHaveLength(1)
})

test('an entrance leaves nothing behind: a fill that stays would keep a transform on the element', () => {
  const rules = css.match(/animation: [^;]*--enter-duration[^;]*;/g) ?? []
  expect(rules.length).toBeGreaterThan(0)
  for (const rule of rules) expect(rule).toMatch(/ backwards;$/)
})

test('a list plays its first 12 rows, 40 ms apart', () => {
  expect(valueIn(baseBlock(), '--enter-stagger')).toBe('40ms')
  expect(css.match(/:is\(\.enter-rows, \.enter-cards\) > :nth-child\(\d+\) \{ --i: \d+; \}/g)).toHaveLength(11)
  expect(css).toContain('.enter-rows:not([data-entered]) > :nth-child(-n + 12)')
  expect(css).toContain('.enter-cards:not([data-entered]) > :nth-child(-n + 12)')
})

test('the shelves keep their cascade on the same tokens, so reduced motion reaches it too', () => {
  for (const name of ['enter-shelf-title', 'enter-shelf-card', 'enter-shelf-end']) {
    const frame = css.slice(css.indexOf(`@keyframes ${name} {`), css.indexOf('}\n}', css.indexOf(`@keyframes ${name} {`)))
    expect(frame).toContain('var(--enter-rise)')
  }
  expect(css).toContain('.enter-shelves > :nth-child(5) { --shelf: 4; }')
})

test('Tailwind sees the colours and radii', () => {
  for (const name of ['--color-hardcore', '--color-softcore', '--radius-chip', '--radius-control', '--radius-field', '--radius-card', '--radius-button', '--radius-tag', '--radius-pane', '--radius-tile']) {
    expect(css).toContain(`${name}:`)
  }
})
