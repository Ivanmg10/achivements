import { applyPerfectOrder, buildPerfectGames, countPerfectGames } from './perfectGames'
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
