import { raPlayRing, retroRatio } from './raRatio'

const user = (TotalPoints: number | null, TotalSoftcorePoints: number | null, TotalTruePoints: number | null) => ({ TotalPoints, TotalSoftcorePoints, TotalTruePoints })

test('the RetroRatio is true points over hardcore points', () => {
  expect(retroRatio(user(9121, 1865, 26033))).toBeCloseTo(2.854, 3)
})

test('no hardcore points, no RetroRatio', () => {
  expect(retroRatio(user(0, 500, 0))).toBeNull()
  expect(retroRatio(user(null, null, null))).toBeNull()
})

test('the ring follows which kind of points the account has more of, not the RetroRatio', () => {
  expect(raPlayRing(user(9121, 1865, 26033))).toBe('rgb(var(--hardcore))')
  // A RetroRatio above 1 read as "over 80 %": softcore-heavy accounts were gold too.
  expect(raPlayRing(user(272, 2202, 951))).toBe('rgb(var(--softcore))')
  expect(raPlayRing(user(100, 100, 300))).toBe('rgb(var(--softcore))')
  expect(raPlayRing(user(0, 0, 0))).toBe('rgb(var(--ink) / 0.3)')
})
