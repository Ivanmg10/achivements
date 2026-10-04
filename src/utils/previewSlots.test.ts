import { previewColumns, previewCounts } from './sectionPreview'

test('columns fit the width, one on a phone', () => {
  expect(previewColumns(360)).toBe(1)
  expect(previewColumns(2460)).toBe(7)
  expect(previewColumns(1000)).toBe(3)
})

test('a phone previews three per section', () => {
  expect(previewCounts(1, 800, [27, 122])).toEqual([3, 3])
})

test('the previews together fill the height, shared evenly when both have games', () => {
  // 1327 tall, 7 columns: 11 rows fit beside two sections' chrome.
  const [ra, steam] = previewCounts(7, 1327, [200, 200])
  expect(ra + steam).toBeGreaterThan(7 * 8)
  expect(Math.abs(ra - steam)).toBeLessThanOrEqual(7)
})

test('a section with few games hands its spare rows to the others', () => {
  const [ra, steam] = previewCounts(7, 1327, [10, 200])
  expect(ra).toBe(14) // two rows hold its 10 games
  expect(steam).toBeGreaterThan(14)
})

test('more platforms leave each fewer rows, never none', () => {
  const four = previewCounts(7, 1327, [200, 200, 200, 200])
  expect(four.every((n) => n >= 7)).toBe(true)
  expect(previewCounts(7, 300, [200, 200, 200])).toEqual([7, 7, 7])
})
