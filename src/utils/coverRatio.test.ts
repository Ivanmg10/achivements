import { raBoxRatio } from './coverRatio'

test("a console's box keeps its shape; any other holds a PS2 box", () => {
  expect(raBoxRatio('Nintendo DS')).toBeGreaterThan(1)
  expect(raBoxRatio('PlayStation Portable')).toBeLessThan(0.6)
  expect(raBoxRatio('PlayStation 2')).toBe(0.71)
  expect(raBoxRatio(null)).toBe(0.71)
})
