import { raPreviewGames, steamPreviewGames } from './sectionPreview'
import { toSteamGameProgress } from './steamMappers'

const completed = (id: number, pct: string) => ({
  GameID: id, Title: `G${id}`, ImageIcon: `/i${id}.png`, ConsoleID: 1, ConsoleName: 'SNES',
  MaxPossible: 10, NumAwarded: 5, PctWon: pct, HardcoreMode: '0',
})

test('RA: as many as asked for, with completion as a percentage', () => {
  const games = [1, 2, 3, 4].map((i) => completed(i, i === 1 ? '0.5' : i === 2 ? '1' : '0'))
  const preview = raPreviewGames(games, 3)
  expect(preview.map((g) => g.key)).toEqual(['ra:2', 'ra:1', 'ra:3'])
  expect(preview[1]).toMatchObject({ source: 'ra', id: 1, title: 'G1', subtitle: 'SNES', imageRef: '/i1.png', pct: 50 })
  expect(preview[0].pct).toBe(100)
})

test('RA want-to-play games have no progress and use their ID', () => {
  const want = { ID: 9, Title: 'W', ImageIcon: '/w.png', ConsoleID: 1, ConsoleName: 'NES', PointsTotal: 0, AchievementsPublished: 3, GameTitle: 'W' }
  expect(raPreviewGames([want])[0]).toMatchObject({ key: 'ra:9', id: 9, pct: null })
})

test('Steam: progress only once counts are known', () => {
  const unknown = toSteamGameProgress({ appid: 1, name: 'A', playtime_forever: 0 })
  const known = { ...toSteamGameProgress({ appid: 2, name: 'B', playtime_forever: 0 }), achievementsLoaded: true, maxPossible: 4, numAwarded: 1, pctWon: 25 }
  const preview = steamPreviewGames([unknown, known])
  // The one with progress sorts ahead of the unknown one.
  expect(preview.map((g) => g.pct)).toEqual([25, null])
  expect(preview[0]).toMatchObject({ key: 'steam:2', source: 'steam', subtitle: 'Steam' })
})

test('furthest along first, games without progress after them in their order', () => {
  const games = [completed(1, '0.2'), completed(2, '0.9'), completed(3, '0.5')]
  expect(raPreviewGames(games).map((g) => g.id)).toEqual([2, 3, 1])
  const want = [9, 8].map((ID) => ({ ID, Title: 'W', ImageIcon: '/w.png', ConsoleID: 1, ConsoleName: 'NES', PointsTotal: 0, AchievementsPublished: 3, GameTitle: 'W' }))
  expect(raPreviewGames([...want, completed(4, '0.1')] as never).map((g) => g.id)).toEqual([4, 9, 8])
})

test('the cut is taken after sorting, so the best are not lost past the limit', () => {
  const games = [completed(1, '0.1'), completed(2, '0.2'), completed(3, '0.95')]
  expect(raPreviewGames(games, 1).map((g) => g.id)).toEqual([3])
})
