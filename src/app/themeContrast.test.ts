import { contrast, mixOklab, tint } from './themeContrast'

test('black on white is 21:1 and a colour on itself 1:1', () => {
  expect(contrast('0 0 0', '255 255 255')).toBeCloseTo(21, 5)
  expect(contrast('12 34 56', '12 34 56')).toBe(1)
})

test('a tint is the colour laid over the ground at its alpha', () => {
  expect(tint('255 0 0', 0.5, '0 0 0')).toBe('128 0 0')
  expect(tint('10 20 30', 0, '100 100 100')).toBe('100 100 100')
})

test('an oklab mix at 100 % or 0 % returns an end, and a half is lighter than the dark end', () => {
  expect(mixOklab('250 204 21', 1, '32 34 40')).toBe('250 204 21')
  expect(mixOklab('250 204 21', 0, '32 34 40')).toBe('32 34 40')
  expect(contrast(mixOklab('250 204 21', 0.5, '0 0 0'), '0 0 0')).toBeGreaterThan(contrast('32 34 40', '0 0 0'))
})
