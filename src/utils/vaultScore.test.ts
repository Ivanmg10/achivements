import {
  difficultyMultiplier,
  looksUnlockedByTool,
  provisionalScore,
  rarityMultiplier,
  scoreGame,
  shrinkRarity,
  stackFactors,
  stackKey,
  type ScoreAchievement,
} from './vaultScore'

const lin = (n: number, a: number, b: number) => Array.from({ length: n }, (_, i) => a + (b - a) * (n === 1 ? 0 : i / (n - 1)))
const all = (list: { w: number; r: number }[], earnedAt = '2026-10-01T10:00:00Z'): ScoreAchievement[] =>
  list.map(({ w, r }) => ({ native: w, rarity: r, earned: true, earnedAt }))

// The illustrative games of docs/rankings-plan.md: one AAA game as each platform would report it.
const psnAAA = [{ w: 90, r: 8 }, ...lin(6, 30, 8).map((r) => ({ w: 90, r })), ...lin(12, 60, 20).map((r) => ({ w: 30, r })), ...lin(30, 95, 25).map((r) => ({ w: 15, r }))]
const steamAAA = psnAAA.map((a) => ({ w: 1, r: a.r * 0.62 }))
const xboxAAA = [...lin(7, 30, 8).map((r) => ({ w: 90, r })), ...lin(12, 60, 20).map((r) => ({ w: 20, r })), ...lin(30, 95, 25).map((r) => ({ w: 6, r }))]
const raRetro = [...lin(6, 12, 2).map((r) => ({ w: 25, r })), ...lin(14, 30, 6).map((r) => ({ w: 10, r })), ...lin(20, 55, 15).map((r) => ({ w: 5, r }))]

describe('scoreGame balance', () => {
  it('scores the same finished game within 10 % on every platform', () => {
    const scores = [psnAAA, steamAAA, xboxAAA, raRetro].map((g) => scoreGame(all(g)).points)
    const avg = scores.reduce((s, x) => s + x, 0) / scores.length
    expect((Math.max(...scores) - Math.min(...scores)) / avg).toBeLessThanOrEqual(0.11)
  })

  it('gives an easy game about a third of a demanding one, and a 5000-achievement game no more', () => {
    const aaa = scoreGame(all(psnAAA)).points
    const quickPlatinum = scoreGame(all([{ w: 90, r: 45 }, { w: 90, r: 50 }, ...lin(10, 70, 55).map((r) => ({ w: 15, r }))])).points
    const spam = scoreGame(all(lin(5000, 2.3, 1.9).map((r) => ({ w: 1, r })))).points
    expect(quickPlatinum / aaa).toBeGreaterThan(0.25)
    expect(quickPlatinum / aaa).toBeLessThan(0.45)
    expect(spam / aaa).toBeLessThan(0.45)
  })
})

describe('scoreGame', () => {
  it('is zero with nothing earned', () => {
    expect(scoreGame([{ native: 10, rarity: 50, earned: false, earnedAt: null }])).toEqual({ points: 0, earned: 0, total: 1, completed: false, unlocks: [] })
  })

  it('adds a fifth for a finished game, dated on its last unlock', () => {
    const list: ScoreAchievement[] = lin(5, 90, 10).map((r, i) => ({ native: 1, rarity: r, earned: true, earnedAt: `2026-10-0${i + 1}T12:00:00Z` }))
    const done = scoreGame(list)
    const partial = scoreGame(list.map((a, i) => (i === 4 ? { ...a, earned: false, earnedAt: null } : a)))
    expect(done.completed).toBe(true)
    expect(partial.completed).toBe(false)
    const last = done.unlocks[done.unlocks.length - 1]
    expect(last[0]).toBe(Date.UTC(2026, 9, 5) / 1000)
    expect(done.points).toBe(done.unlocks.reduce((s, [, p]) => s + p, 0))
  })

  it('halves softcore unlocks and never counts them as finished', () => {
    const hard = scoreGame(all(lin(5, 80, 20).map((r) => ({ w: 5, r }))))
    const soft = scoreGame(all(lin(5, 80, 20).map((r) => ({ w: 5, r }))).map((a) => ({ ...a, softcore: true })))
    expect(soft.completed).toBe(false)
    expect(soft.points).toBeCloseTo(hard.points / 1.2 / 2, -1)
  })

  it('groups unlocks by day and keeps unknown dates apart', () => {
    const s = scoreGame([
      { native: 1, rarity: 50, earned: true, earnedAt: '2026-10-01T01:00:00Z' },
      { native: 1, rarity: 40, earned: true, earnedAt: '2026-10-01T23:00:00Z' },
      { native: 1, rarity: 30, earned: true, earnedAt: null },
      { native: 1, rarity: 20, earned: false, earnedAt: null },
      { native: 1, rarity: 10, earned: false, earnedAt: null },
    ])
    expect(s.unlocks.map(([t]) => t)).toEqual([0, Date.UTC(2026, 9, 1) / 1000])
  })

  it('falls back to native weights when the platform gives no rarity', () => {
    const s = scoreGame([
      { native: 90, rarity: null, earned: true, earnedAt: null },
      { native: 10, rarity: null, earned: false, earnedAt: null },
    ])
    expect(s.points).toBe(Math.round(1000 * 0.9 * 1.5 * 0.7))
  })

  it('softens RA rarities measured on very few players', () => {
    expect(shrinkRarity(100, 3)).toBeLessThan(40)
    expect(shrinkRarity(33, 500)).toBe(33)
  })
})

describe('multipliers', () => {
  it('rarity goes from ×1 to ×4 and stops at 0.1 %', () => {
    expect(rarityMultiplier(1)).toBe(1)
    expect(rarityMultiplier(0.1)).toBeCloseTo(2)
    expect(rarityMultiplier(0.00001)).toBeCloseTo(4)
  })
  it('difficulty goes from ×0.4 to ×1', () => {
    expect(difficultyMultiplier(1)).toBeCloseTo(0.4)
    expect(difficultyMultiplier(0.1)).toBeCloseTo(1)
    expect(difficultyMultiplier(0.01)).toBeCloseTo(1)
  })
})

describe('provisionalScore', () => {
  it('uses the median multipliers and no date', () => {
    expect(provisionalScore(0.5, 10, 20, false)).toEqual({ points: 525, earned: 10, total: 20, completed: false, unlocks: [[0, 525]] })
    expect(provisionalScore(0, 0, 20, false).points).toBe(0)
  })
})

describe('looksUnlockedByTool', () => {
  const at = (iso: string) => ({ native: 1, rarity: 10, earned: true, earnedAt: iso })
  it('spots most achievements on one second', () => {
    expect(looksUnlockedByTool(Array.from({ length: 12 }, () => at('2026-01-01T00:00:00Z')))).toBe(true)
  })
  it('leaves real play and short lists alone', () => {
    expect(looksUnlockedByTool(Array.from({ length: 12 }, (_, i) => at(`2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)))).toBe(false)
    expect(looksUnlockedByTool(Array.from({ length: 5 }, () => at('2026-01-01T00:00:00Z')))).toBe(false)
  })
})

describe('stacks', () => {
  it('reads regional and console copies as one title', () => {
    expect(stackKey('Tales of Arise (PS4)')).toBe(stackKey('Tales of Arise™ PS5'))
    expect(stackKey('Ratchet & Clank [EU]')).toBe(stackKey('Ratchet & Clank'))
    expect(stackKey('Dark Souls')).not.toBe(stackKey('Dark Souls II'))
  })
  it('keeps the best copy whole, the second at half and the rest at a tenth', () => {
    expect(stackFactors([{ key: 'a', points: 100 }, { key: 'a', points: 300 }, { key: 'b', points: 50 }, { key: 'a', points: 200 }])).toEqual([0.1, 1, 1, 0.5])
  })
})
