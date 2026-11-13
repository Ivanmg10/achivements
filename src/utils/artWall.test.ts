import { ART_WALL_RA, ART_WALL_STEAM, dealBothPlatforms } from './artWall'

test('the pool is the platforms\' own pictures', () => {
  for (const src of ART_WALL_RA) expect(src).toMatch(/^https:\/\/media\.retroachievements\.org\/Images\/\d+\.png$/)
  for (const src of ART_WALL_STEAM) expect(src).toMatch(/^https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/apps\/\d+\//)
  expect(new Set(ART_WALL_RA).size).toBe(ART_WALL_RA.length)
})

test('deals the two platforms as a checkerboard, across and down', () => {
  expect(dealBothPlatforms(['r1', 'r2', 'r3'], ['s1', 's2', 's3'], 4, 2)).toEqual(['r1', 's1', 's2', 'r2'])
  expect(dealBothPlatforms(['r1', 'r2'], ['s1', 's2'], 4, 1)).toEqual(['r1', 's1', 'r2', 's2'])
})

test('carries on with the other platform once one runs out, and stops when both do', () => {
  expect(dealBothPlatforms(['r1'], ['s1', 's2', 's3'], 4, 1)).toEqual(['r1', 's1', 's2', 's3'])
  expect(dealBothPlatforms(['r1'], ['s1'], 5, 1)).toEqual(['r1', 's1'])
})
