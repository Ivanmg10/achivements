import { DRAW_MS, dotDelay } from './drawTiming'

test('each dot appears as the line reaches it: first at once, last as the drawing ends', () => {
  expect(dotDelay(0, 7)).toBe(0)
  expect(dotDelay(3, 7)).toBe(DRAW_MS / 2)
  expect(dotDelay(6, 7)).toBe(DRAW_MS)
})

test('a lone point needs no wait', () => {
  expect(dotDelay(0, 1)).toBe(0)
})

test('the drawing is short', () => {
  expect(DRAW_MS).toBeLessThanOrEqual(800)
})
