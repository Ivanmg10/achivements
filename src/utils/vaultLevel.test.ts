import { levelOf, levelProgress, monthStart, pointsForLevel, tierOf, weekStart } from './vaultLevel'

describe('levels', () => {
  it('follows 60 × L^2.2 and settles on the thresholds', () => {
    expect(pointsForLevel(1)).toBe(0)
    expect(levelOf(0)).toBe(1)
    expect(levelOf(500)).toBe(2)
    expect(levelOf(28_000)).toBe(16)
    expect(levelOf(126_000)).toBe(32)
    expect(levelOf(2_000_000)).toBe(113)
    for (const l of [2, 10, 45, 90]) {
      expect(levelOf(pointsForLevel(l))).toBe(l)
      expect(levelOf(pointsForLevel(l) - 1)).toBe(l - 1)
    }
  })

  it('names the tier of a level', () => {
    expect(tierOf(1)).toBe('novice')
    expect(tierOf(29)).toBe('hunter')
    expect(tierOf(30)).toBe('veteran')
    expect(tierOf(150)).toBe('legend')
  })

  it('says how far into the level and what tier comes next', () => {
    const p = levelProgress(126_000)
    expect(p.level).toBe(32)
    expect(p.into + pointsForLevel(32)).toBe(126_000)
    expect(p.pct).toBeGreaterThan(0)
    expect(p.pct).toBeLessThan(100)
    expect(p.nextTier).toEqual({ id: 'expert', from: 45 })
    expect(levelProgress(5_000_000).nextTier).toBeNull()
  })
})

describe('periods', () => {
  it('starts weeks on Monday and months on the first, in UTC', () => {
    expect(weekStart(new Date('2026-10-20T10:00:00Z'))).toBe('2026-10-19')
    expect(weekStart(new Date('2026-10-19T00:00:00Z'))).toBe('2026-10-19')
    expect(weekStart(new Date('2026-10-25T23:59:00Z'))).toBe('2026-10-19')
    expect(monthStart(new Date('2026-10-20T10:00:00Z'))).toBe('2026-10-01')
  })
})
