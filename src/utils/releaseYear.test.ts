import { mapLimit, parseReleaseYear } from './utils'

test('reads the year out of any of the date shapes RA and Steam use', () => {
  expect(parseReleaseYear('2008-03-11')).toBe(2008)
  expect(parseReleaseYear('9 NOV 2015')).toBe(2015)
  expect(parseReleaseYear('March 1997')).toBe(1997)
  expect(parseReleaseYear('Coming soon')).toBeNull()
  expect(parseReleaseYear(null)).toBeNull()
})

test('mapLimit keeps order, never runs more than the limit at once, and reports failures', async () => {
  let running = 0, peak = 0
  const results = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
    running++; peak = Math.max(peak, running)
    await new Promise((r) => setTimeout(r, 5))
    running--
    if (n === 4) throw new Error('nope')
    return n * 10
  })
  expect(peak).toBe(2)
  expect(results.map((r) => (r.status === 'fulfilled' ? r.value : 'x'))).toEqual([10, 20, 30, 'x', 50, 60])
})
