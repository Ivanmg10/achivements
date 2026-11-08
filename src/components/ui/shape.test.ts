import { MARK, SLANT_PLATE } from './shape'

test('a leaning plate reads the one angle and the bar radius, so the round design stands it up', () => {
  expect(SLANT_PLATE).toContain('before:skew-x-(--slant)')
  expect(SLANT_PLATE).toContain('before:rounded-(--bar-radius)')
})

test('the mark is the design token, never a literal glyph', () => {
  expect(MARK).toBe('before:content-(--mark)')
})
