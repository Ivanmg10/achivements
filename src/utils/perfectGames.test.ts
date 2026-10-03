import { applyPerfectOrder, buildPerfectGames, countPerfectGames, filterPerfects, groupPerfectsByYear, latestPerfects, perfectDates } from './perfectGames'
import type { RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'

function ra(id: number, title: string, over: Partial<RetroAchievementsGameCompleted> = {}): RetroAchievementsGameCompleted {
  return {
    GameID: id, Title: title, ImageIcon: `/Images/${id}.png`, ConsoleID: 1, ConsoleName: 'SNES',
    MaxPossible: 10, NumAwarded: 10, PctWon: '1.0', HardcoreMode: '1', ...over,
  }
}

function steam(id: number, title: string, over: Partial<SteamGameProgress> = {}): SteamGameProgress {
  return {
    _source: 'steam', id, title, imageIcon: `https://cdn/${id}.jpg`, consoleName: 'Steam',
    maxPossible: 10, numAwarded: 10, pctWon: 100, lastPlayed: '2024-01-01T00:00:00.000Z',
    playtimeForever: 100, playtime2Weeks: 0, imgLogoUrl: '', hasStats: true, achievementsLoaded: true, ...over,
  } as SteamGameProgress
}

describe('buildPerfectGames', () => {
  test('takes the perfect games of both platforms, keyed by platform and id', () => {
    const games = buildPerfectGames([ra(1, 'Zelda'), ra(2, 'Half done', { PctWon: '0.5' })], [steam(620, 'Portal 2'), steam(3, 'Started', { numAwarded: 3, pctWon: 30 })])
    expect(games.map((g) => g.key)).toEqual(['ra:1', 'steam:620'])
    expect(games[0]).toMatchObject({ source: 'ra', title: 'Zelda', subtitle: 'SNES', hardcore: true })
    expect(games[0].imageUrl).toBe('https://retroachievements.org/Images/1.png')
    expect(games[1]).toMatchObject({ source: 'steam', id: 620, subtitle: 'Steam', hardcore: false })
  })

  test('keeps the hardcore row when an RA game is perfect in both modes', () => {
    const softFirst = buildPerfectGames([ra(1, 'Zelda', { HardcoreMode: '0' }), ra(1, 'Zelda')], [])
    const hardFirst = buildPerfectGames([ra(1, 'Zelda'), ra(1, 'Zelda', { HardcoreMode: '0' })], [])
    expect(softFirst).toHaveLength(1)
    expect(softFirst[0].hardcore).toBe(true)
    expect(hardFirst[0].hardcore).toBe(true)
  })

  test('works with no Steam library at all', () => {
    expect(buildPerfectGames([ra(1, 'Zelda')])).toHaveLength(1)
  })
})

describe('countPerfectGames', () => {
  test('counts RA hardcore, RA softcore and Steam apart', () => {
    const games = buildPerfectGames([ra(1, 'A'), ra(2, 'B', { HardcoreMode: '0' })], [steam(620, 'C')])
    expect(countPerfectGames(games)).toEqual({ hc: 1, sc: 1, steam: 1 })
  })
})

describe('applyPerfectOrder', () => {
  const games = buildPerfectGames([ra(1, 'Zelda'), ra(2, 'Alpha')], [steam(620, 'Portal 2')])

  test('follows the saved order, across platforms', () => {
    expect(applyPerfectOrder(games, ['steam:620', 'ra:1', 'ra:2']).map((g) => g.key)).toEqual(['steam:620', 'ra:1', 'ra:2'])
  })

  test('puts whatever the order does not name after it, by title', () => {
    expect(applyPerfectOrder(games, ['ra:1']).map((g) => g.title)).toEqual(['Zelda', 'Alpha', 'Portal 2'])
  })

  test('ignores keys for games that are no longer perfect, and repeated keys', () => {
    expect(applyPerfectOrder(games, ['ra:999', 'ra:1', 'ra:1']).map((g) => g.key)).toEqual(['ra:1', 'ra:2', 'steam:620'])
  })
})

describe('latestPerfects', () => {
  const award = (id: number, date: string, extra = 1, type = 'Mastery/Completion') => ({
    AwardedAt: date, AwardType: type, AwardData: id, AwardDataExtra: extra, Title: `Game ${id}`, ConsoleName: 'SNES', ImageIcon: `/Images/${id}.png`,
  })

  test('newest first across both platforms, three by default', () => {
    const steamGames = [
      steam(620, 'Portal 2', { lastPlayed: '2024-03-01T00:00:00Z' }),
    ]
    const result = latestPerfects(
      [award(1, '2024-01-01T00:00:00Z'), award(2, '2024-05-01T00:00:00Z'), award(3, '2024-02-01T00:00:00Z')],
      steamGames,
    )
    expect(result.map((r) => r.key)).toEqual(['ra:2', 'steam:620', 'ra:3'])
  })

  test('only masteries and completions count, not beaten awards', () => {
    const result = latestPerfects([award(1, '2024-01-01T00:00:00Z', 1, 'Game Beaten')])
    expect(result).toEqual([])
  })

  test('one entry per RA game, at its latest date, hardcore when the mastery is', () => {
    const result = latestPerfects([award(1, '2024-01-01T00:00:00Z', 0), award(1, '2024-06-01T00:00:00Z', 1)])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ date: '2024-06-01T00:00:00Z', hardcore: true, iconUrl: 'https://retroachievements.org/Images/1.png' })
  })
})

describe('collection helpers', () => {
  const award = (id: number, date: string, extra = 1) => ({
    AwardedAt: date, AwardType: 'Mastery/Completion', AwardData: id, AwardDataExtra: extra, Title: `G${id}`, ConsoleName: 'SNES', ImageIcon: '',
  })
  const games = buildPerfectGames([ra(1, 'A'), ra(2, 'B', { HardcoreMode: '0' }), ra(3, 'C')], [steam(620, 'Portal 2')])

  test('perfectDates: RA from its latest award, Steam from its last session', () => {
    const dates = perfectDates([award(1, '2024-01-01T00:00:00Z'), award(1, '2025-03-01T00:00:00Z')], [steam(620, 'Portal 2', { lastPlayed: '2023-05-01T00:00:00Z' })])
    expect(dates.get('ra:1')).toBe('2025-03-01T00:00:00Z')
    expect(dates.get('steam:620')).toBe('2023-05-01T00:00:00Z')
  })

  test('filterPerfects picks one kind', () => {
    expect(filterPerfects(games, 'raHc').map((g) => g.key)).toEqual(['ra:1', 'ra:3'])
    expect(filterPerfects(games, 'raSc').map((g) => g.key)).toEqual(['ra:2'])
    expect(filterPerfects(games, 'steam').map((g) => g.key)).toEqual(['steam:620'])
    expect(filterPerfects(games, 'all')).toHaveLength(4)
  })

  test('groupPerfectsByYear: newest year first, newest game first, undated last', () => {
    const dates = new Map([
      ['ra:1', '2024-02-01T00:00:00Z'],
      ['ra:3', '2024-09-01T00:00:00Z'],
      ['steam:620', '2025-01-10T00:00:00Z'],
    ])
    expect(groupPerfectsByYear(games, dates).map((g) => [g.year, g.games.map((x) => x.key)])).toEqual([
      [2025, ['steam:620']],
      [2024, ['ra:3', 'ra:1']],
      [null, ['ra:2']],
    ])
  })
})
