import { buildLibrary, filterLibrary, profileLibrary, sharedGames, summarizeByPlatform, summarizeConsoles, type LibraryGame } from './library'
import type { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { psnGameFixture } from '@/test-utils/psnFixtures'

const ra = (id: number, pct: string, over: Partial<RetroAchievementsGameCompleted> = {}): RetroAchievementsGameCompleted => ({
  GameID: id, Title: `Pokémon ${id}`, ImageIcon: `/Images/${id}.png`, ConsoleID: 5, ConsoleName: 'Game Boy Advance',
  MaxPossible: 10, NumAwarded: 5, PctWon: pct, HardcoreMode: '1', ...over,
})
const want = (id: number): WantToPlayGame => ({
  ID: id, Title: `Zelda ${id}`, ImageIcon: '', ConsoleID: 3, ConsoleName: 'SNES', PointsTotal: 0, AchievementsPublished: 10, GameTitle: '',
})
const steam = (id: number, over: Partial<SteamGameProgress> = {}) =>
  ({ id, title: `Portal ${id}`, imageIcon: '', maxPossible: 10, numAwarded: 10, pctWon: 100, playtimeForever: 60, achievementsLoaded: true, hasStats: true, ...over }) as SteamGameProgress

describe('buildLibrary', () => {
  test('joins both platforms with a status and a link each', () => {
    const lib = buildLibrary({ playing: [ra(1, '0.5')], completed: [ra(2, '1.0')], wantToPlay: [want(3)] }, [steam(620)])
    expect(lib.map((g) => [g.key, g.status, g.pct, g.href])).toEqual([
      ['ra:1', 'playing', 50, '/gameInfo/1'],
      ['ra:2', 'completed', 100, '/gameInfo/2'],
      ['ra:3', 'wantToPlay', 0, '/gameInfo/3'],
      ['steam:620', 'completed', 100, '/steamGame/620'],
    ])
  })

  test('one entry per RA game, at its higher progress', () => {
    const lib = buildLibrary({ playing: [ra(1, '0.3'), ra(1, '0.6')], completed: [], wantToPlay: [] })
    expect(lib).toHaveLength(1)
    expect(lib[0].pct).toBe(60)
  })

  test('a started game is not also listed as want to play', () => {
    const lib = buildLibrary({ playing: [ra(3, '0.2')], completed: [], wantToPlay: [want(3)] })
    expect(lib.map((g) => g.status)).toEqual(['playing'])
  })

  test('leaves out Steam games with no status yet', () => {
    expect(buildLibrary({ playing: [], completed: [], wantToPlay: [] }, [steam(1, { achievementsLoaded: false })])).toEqual([])
  })
})

describe('filterLibrary', () => {
  const lib = buildLibrary({ playing: [ra(1, '0.5')], completed: [], wantToPlay: [want(3)] }, [steam(620)])

  test('matches titles ignoring case and accents', () => {
    expect(filterLibrary(lib, { query: 'POKEMON', source: 'all', status: 'all' }).map((g) => g.key)).toEqual(['ra:1'])
  })

  test('narrows by platform and by status', () => {
    expect(filterLibrary(lib, { query: '', source: 'steam', status: 'all' }).map((g) => g.key)).toEqual(['steam:620'])
    expect(filterLibrary(lib, { query: '', source: 'all', status: 'wantToPlay' }).map((g) => g.key)).toEqual(['ra:3'])
  })
})

test('summarizeConsoles counts games once each and the share at 100%', () => {
  const games = [ra(1, '1.0'), ra(1, '0.5', { HardcoreMode: '0' }), ra(2, '0.4'), ra(3, '1.0', { ConsoleID: 18, ConsoleName: 'Nintendo DS' })]
  expect(summarizeConsoles(games)).toEqual([
    { consoleId: 5, console: 'Game Boy Advance', games: 2, completed: 1, pct: 50 },
    { consoleId: 18, console: 'Nintendo DS', games: 1, completed: 1, pct: 100 },
  ])
})

const psnGame = (id: number, pctWon: number, lastPlayed = '2024-01-02T00:00:00.000Z') => psnGameFixture({
  id, titleId: `NPWR${String(Math.floor(id / 100)).padStart(5, '0')}_${String(id % 100).padStart(2, '0')}`,
  service: 'trophy2', title: `PS ${id}`, imageIcon: `https://psn/${id}.png`, consoleName: 'PS5',
  maxPossible: 10, numAwarded: Math.round(pctWon / 10), pctWon, lastPlayed,
  earned: { bronze: 1, silver: 0, gold: 0, platinum: pctWon >= 100 ? 1 : 0 },
  defined: { bronze: 9, silver: 0, gold: 0, platinum: 1 },
  lastTrophyAt: lastPlayed, playtimeMinutes: null, playedAs: [], playCount: null, coverUrl: null, heroUrl: null,
})

test('PSN games join the library with their own status and page', () => {
  const lib = buildLibrary({ playing: [], completed: [], wantToPlay: [] }, [], [psnGame(100, 100), psnGame(200, 40), psnGame(300, 0)])
  expect(lib.map((g) => [g.key, g.status, g.href])).toEqual([
    ['psn:100', 'completed', '/psnGame/NPWR00001_00'],
    ['psn:200', 'playing', '/psnGame/NPWR00002_00'],
    ['psn:300', 'wantToPlay', '/psnGame/NPWR00003_00'],
  ])
  expect(filterLibrary(lib, { query: '', source: 'psn', status: 'all' })).toHaveLength(3)
})

describe('profileLibrary', () => {
  const steamGame = (id: number, numAwarded: number, playtimeForever = 60) =>
    ({ id, title: `S${id}`, imageIcon: '', playtimeForever, achievementsLoaded: true, maxPossible: 10, numAwarded, pctWon: numAwarded * 10, lastPlayed: null }) as unknown as SteamGameProgress

  test("lists their played games, less the hidden ones, each opening their progress", () => {
    const games = profileLibrary([ra(1, '1'), ra(2, '0.5')], [steamGame(7, 3), steamGame(8, 0)], [], ['ra:2'], 'ivan')
    expect(games.map((g) => g.key)).toEqual(['ra:1', 'steam:7'])
    expect(games[0]).toMatchObject({ status: 'completed', href: '/user/ivan/ra/1' })
    expect(games[1]).toMatchObject({ status: 'playing', href: '/user/ivan/steam/7' })
  })

  test("without a subject a game opens its own page", () => {
    expect(profileLibrary([ra(1, '0.2')])[0].href).toBe('/gameInfo/1')
  })

  test('keeps PSN games at 0%: their trophy list only has games they played', () => {
    expect(profileLibrary([], [], [psnGameFixture({ id: 5, pctWon: 0 })])).toHaveLength(1)
  })
})

const lib = (key: string, pct: number, status: LibraryGame['status'] = pct >= 100 ? 'completed' : 'playing'): LibraryGame => {
  const [source, id] = key.split(':')
  return { key, source: source as LibraryGame['source'], id: Number(id), title: key, subtitle: '', status, pct, href: '' }
}

test('summarizes each platform that has games, in the usual order', () => {
  expect(summarizeByPlatform([lib('psn:1', 50), lib('ra:1', 100), lib('ra:2', 40)])).toEqual([
    { source: 'ra', games: 2, completed: 1, playing: 1, avgPct: 70 },
    { source: 'psn', games: 1, completed: 0, playing: 1, avgPct: 50 },
  ])
})

test('shared games are the ones in both lists, furthest along together first', () => {
  const shared = sharedGames([lib('ra:1', 10), lib('ra:2', 90), lib('steam:2', 50)], [lib('ra:2', 40), lib('ra:1', 100), lib('psn:9', 1)])
  expect(shared.map((g) => [g.key, g.theirPct, g.myPct])).toEqual([
    ['ra:2', 90, 40],
    ['ra:1', 10, 100],
  ])
})

describe('Xbox in the library', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { buildLibrary, profileLibrary, summarizeByPlatform } = require('./library') as typeof import('./library')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { xboxGameFixture } = require('@/test-utils/xboxFixtures') as typeof import('@/test-utils/xboxFixtures')

  const none = { playing: [], completed: [], wantToPlay: [] }

  test('an Xbox game is one entry, with its status, progress and page', () => {
    const [g] = buildLibrary(none, [], [], [xboxGameFixture({ id: 730, title: 'Halo', pctWon: 100 })])
    expect(g).toMatchObject({ key: 'xbox:730', source: 'xbox', title: 'Halo', subtitle: 'Xbox', status: 'completed', pct: 100, href: '/xboxGame/730' })
  })

  test("a profile leaves out Xbox games with no achievements, and opens the rest as that user's", () => {
    const owned = xboxGameFixture({ id: 1, totalGamerscore: 0, maxPossible: 0, numAwarded: 0, pctWon: 0 })
    const played = xboxGameFixture({ id: 2, pctWon: 20 })
    const list = profileLibrary([], [], [], [], 'ivan', [owned, played])
    expect(list.map((g: { id: number }) => g.id)).toEqual([2])
    expect(list[0].href).toBe('/user/ivan/xbox/2')
  })

  test('hiding an Xbox game by its key works like the other platforms', () => {
    expect(profileLibrary([], [], [], ['xbox:2'], null, [xboxGameFixture({ id: 2 })])).toEqual([])
  })

  test('the platform summary lists Xbox, in the app order, after PlayStation', () => {
    const games = buildLibrary(none, [], [], [xboxGameFixture({ id: 1, pctWon: 100 })])
    expect(summarizeByPlatform(games).map((s: { source: string }) => s.source)).toEqual(['xbox'])
  })
})
