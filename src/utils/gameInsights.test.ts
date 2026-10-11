import {
  beatenProgress, finishedAt, fromPsn, fromRa, fromSteam, missablesLeft, nextTargets, paceEstimate, rarestEarned, rarityBands,
  type InsightAchievement,
} from './gameInsights'

const NOW = Date.parse('2026-10-11T00:00:00Z')
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString()
const a = (id: string, o: Partial<InsightAchievement> = {}): InsightAchievement => ({
  id, title: id, description: '', earned: false, earnedAt: null, rarity: 50, points: null, kind: null, iconUrl: null, href: '/x', ...o,
})

describe('adapters', () => {
  test('RA: rarity is the share of players, earned comes from a date, the hardcore date wins', () => {
    const [x, y] = fromRa(
      [
        { ID: 1, Title: 'A', Description: 'd', Points: 5, NumAwarded: 25, BadgeName: '123', Type: 'progression', DateEarned: '2024-01-01', DateEarnedHardcore: '2024-02-02' },
        { ID: 2, Title: 'B', Description: 'd', Points: 10, NumAwarded: 500, BadgeName: '', Type: 'bogus' },
      ] as never,
      100,
      9,
    )
    expect(x).toMatchObject({ id: '1', earned: true, earnedAt: '2024-02-02', rarity: 25, points: 5, kind: 'progression', href: '/gameInfo/9' })
    expect(x.iconUrl).toBe('https://media.retroachievements.org/Badge/123.png')
    // More awards than players cannot be over 100%; an unknown tag is no tag; no badge, no icon.
    expect(y).toMatchObject({ earned: false, rarity: 100, kind: null, iconUrl: null })
  })

  test('RA: no known player count means no rarity', () => {
    expect(fromRa([{ ID: 1, NumAwarded: 5 }] as never, 0, 1)[0].rarity).toBeNull()
  })

  test('Steam and PSN keep their own rarity and link', () => {
    const [s] = fromSteam([{ apiname: 'ACH_1', title: 'S', description: 'd', earned: true, dateEarned: '2024-01-01', globalPct: 4.2, badgeUrl: 'u' }] as never, 7)
    expect(s).toMatchObject({ id: 'ACH_1', earned: true, rarity: 4.2, points: null, iconUrl: 'u' })
    expect(s.href.startsWith('/steamGame/7#')).toBe(true)
    const [p] = fromPsn([{ id: 3, name: 'P', detail: 'd', earned: false, earnedAt: null, rarity: null, iconUrl: null }] as never, 20188)
    expect(p).toMatchObject({ id: '3', earned: false, rarity: null })
    expect(p.href).toContain('#')
  })
})

test('rarityBands counts each band, earned and total, and skips unknown rarity', () => {
  const bands = rarityBands([
    a('1', { rarity: 80, earned: true }), a('2', { rarity: 25 }), a('3', { rarity: 24.9 }),
    a('4', { rarity: 3, earned: true }), a('5', { rarity: 0.5 }), a('6', { rarity: null }),
  ])
  expect(bands).toEqual([
    { id: 'common', total: 2, earned: 1 },
    { id: 'uncommon', total: 1, earned: 0 },
    { id: 'rare', total: 1, earned: 1 },
    { id: 'ultra', total: 1, earned: 0 },
  ])
})

test('nextTargets are the unearned with the highest share, the rest left out', () => {
  const list = [a('hard', { rarity: 2 }), a('easy', { rarity: 90 }), a('mid', { rarity: 40 }), a('done', { rarity: 99, earned: true }), a('none', { rarity: null })]
  expect(nextTargets(list).map((x) => x.id)).toEqual(['easy', 'mid', 'hard'])
  expect(nextTargets(list, 1).map((x) => x.id)).toEqual(['easy'])
})

test('rarestEarned are the earned with the lowest share', () => {
  const list = [a('x', { rarity: 30, earned: true }), a('y', { rarity: 1, earned: true }), a('z', { rarity: 0.1 })]
  expect(rarestEarned(list).map((x) => x.id)).toEqual(['y', 'x'])
})

describe('paceEstimate', () => {
  const earned = (n: number, days: number) => Array.from({ length: n }, (_, i) => a(`e${i}`, { earned: true, earnedAt: daysAgo(days - i * 0.1) }))
  const left = (n: number) => Array.from({ length: n }, (_, i) => a(`l${i}`))

  test('counts from the first unlock until today', () => {
    const p = paceEstimate([...earned(7, 14), ...left(6)], NOW)!
    expect(p.perWeek).toBeCloseTo(3.5, 1)
    expect(p.weeksLeft).toBe(2)
  })
  test('a game left alone for long is slow, not fast', () => {
    expect(paceEstimate([...earned(3, 700), ...left(1)], NOW)!.perWeek).toBeLessThan(0.1)
  })
  test('no estimate beyond two years, with too few dates, or with nothing left', () => {
    expect(paceEstimate([...earned(3, 700), ...left(50)], NOW)!.weeksLeft).toBeNull()
    expect(paceEstimate([...earned(2, 10), ...left(1)], NOW)).toBeNull()
    expect(paceEstimate(earned(5, 10), NOW)).toBeNull()
  })
})

test('beatenProgress and missablesLeft read the RA tags', () => {
  const list = [a('1', { kind: 'progression', earned: true }), a('2', { kind: 'win_condition' }), a('3', { kind: 'missable' }), a('4', { kind: 'missable', earned: true }), a('5')]
  expect(beatenProgress(list)).toEqual({ done: 1, total: 2 })
  expect(missablesLeft(list)).toBe(1)
  expect(beatenProgress([a('x')])).toBeNull()
})

test('finishedAt is the last unlock, and only for a finished game', () => {
  expect(finishedAt([a('1', { earned: true, earnedAt: '2024-01-01T00:00:00Z' }), a('2', { earned: true, earnedAt: '2024-03-01T00:00:00Z' })])).toBe('2024-03-01T00:00:00.000Z')
  expect(finishedAt([a('1', { earned: true, earnedAt: '2024-01-01T00:00:00Z' }), a('2')])).toBeNull()
  expect(finishedAt([])).toBeNull()
  expect(finishedAt([a('1', { earned: true })])).toBeNull()
})
