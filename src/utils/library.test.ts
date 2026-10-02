import { buildLibrary, filterLibrary, summarizeConsoles } from './library'
import type { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'

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
