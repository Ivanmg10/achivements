import { slantStyle } from './shape'
import fs from 'fs'
import path from 'path'

const css = fs.readFileSync(path.join(__dirname, '../../app/globals.css'), 'utf8')

test('a bar reads its ends and radius from the design tokens', () => {
  expect(slantStyle(6)).toEqual({ clipPath: 'var(--clip-6)', borderRadius: 'var(--bar-radius)' })
})

test('every slant a component can ask for is defined, and the round design removes each', () => {
  for (const px of [3, 4, 5, 6, 8, 14]) {
    expect(css).toContain(`--clip-${px}: polygon(${px}px 0`)
    expect(css).toContain(`  --clip-${px}: none;`)
  }
  for (const token of ['--slant-button', '--slant-pill', '--slant-line', '--slant-mark', '--slant-cut']) {
    expect(css).toMatch(new RegExp(`:root\\[data-shape="round"\\][^}]*${token}: 0deg`))
  }
})
