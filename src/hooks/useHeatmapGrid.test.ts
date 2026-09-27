import { measureHeatmapGrid, HEATMAP_MAX_DAYS, UNMEASURED } from './useHeatmapGrid'

// A Wednesday, so the current week still has three days to run.
const WEDNESDAY = 3

test('an unmeasured box asks for no grid at all', () => {
  expect(measureHeatmapGrid(0, 0, WEDNESDAY)).toEqual(UNMEASURED)
  expect(measureHeatmapGrid(600, 0, WEDNESDAY)).toEqual(UNMEASURED)
})

test('the cell fills the height, seven rows deep', () => {
  const { cell } = measureHeatmapGrid(600, 200, WEDNESDAY)
  expect(cell * 7 + 6 * 3).toBeLessThanOrEqual(200)
  expect((cell + 1) * 7 + 6 * 3).toBeGreaterThan(200)
})

test('the columns fill the width without overflowing it', () => {
  const { weeks, cell } = measureHeatmapGrid(600, 200, WEDNESDAY)
  const used = weeks * cell + (weeks - 1) * 3
  expect(used).toBeLessThanOrEqual(600)
  expect(used + cell + 3).toBeGreaterThan(600)
})

test('a wider card shows more days rather than bigger ones', () => {
  const narrow = measureHeatmapGrid(300, 200, WEDNESDAY)
  const wide = measureHeatmapGrid(900, 200, WEDNESDAY)

  expect(wide.cell).toBe(narrow.cell)
  expect(wide.days).toBeGreaterThan(narrow.days)
})

test('a taller card shows fewer, bigger days — a week is always seven rows', () => {
  const short = measureHeatmapGrid(600, 120, WEDNESDAY)
  const tall = measureHeatmapGrid(600, 260, WEDNESDAY)

  expect(tall.cell).toBeGreaterThan(short.cell)
  expect(tall.days).toBeLessThan(short.days)
})

test('the last column is the current week, so the count stops short by its rest', () => {
  const { weeks, days } = measureHeatmapGrid(600, 200, WEDNESDAY)
  expect(days).toBe(weeks * 7 - 3)
})

test('on a Saturday the last column is full and no day is left out', () => {
  const { weeks, days } = measureHeatmapGrid(600, 200, 6)
  expect(days).toBe(weeks * 7)
})

test('never asks for more history than is fetched', () => {
  const { days } = measureHeatmapGrid(4000, 200, WEDNESDAY)
  expect(days).toBe(HEATMAP_MAX_DAYS)
})

test('a phone-sized card still draws a readable grid', () => {
  const { weeks, cell } = measureHeatmapGrid(280, 150, WEDNESDAY)
  expect(weeks).toBeGreaterThanOrEqual(6)
  expect(cell).toBeGreaterThanOrEqual(7)
})
