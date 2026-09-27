import { raPreviewGames, steamPreviewGames } from './sectionPreview'
import { toSteamGameProgress } from './steamMappers'

const completed = (id: number, pct: string) => ({
  GameID: id, Title: `G${id}`, ImageIcon: `/i${id}.png`, ConsoleID: 1, ConsoleName: 'SNES',
  MaxPossible: 10, NumAwarded: 5, PctWon: pct, HardcoreMode: '0',
})

test('RA: the first three, with completion as a percentage', () => {
  const games = [completed(1, '0.5'), completed(2, '1'), completed(3, '0'), completed(4, '0.2')]
  const preview = raPreviewGames(games)
  expect(preview.map((g) => g.key)).toEqual(['ra:1', 'ra:2', 'ra:3'])
  expect(preview[0]).toMatchObject({ source: 'ra', id: 1, title: 'G1', subtitle: 'SNES', imageRef: '/i1.png', pct: 50 })
  expect(preview[1].pct).toBe(100)
})

test('RA want-to-play games have no progress and use their ID', () => {
  const want = { ID: 9, Title: 'W', ImageIcon: '/w.png', ConsoleID: 1, ConsoleName: 'NES', PointsTotal: 0, AchievementsPublished: 3, GameTitle: 'W' }
  expect(raPreviewGames([want])[0]).toMatchObject({ key: 'ra:9', id: 9, pct: null })
})

test('Steam: progress only once counts are known', () => {
  const unknown = toSteamGameProgress({ appid: 1, name: 'A', playtime_forever: 0 })
  const known = { ...toSteamGameProgress({ appid: 2, name: 'B', playtime_forever: 0 }), achievementsLoaded: true, maxPossible: 4, numAwarded: 1, pctWon: 25 }
  const preview = steamPreviewGames([unknown, known])
  expect(preview.map((g) => g.pct)).toEqual([null, 25])
  expect(preview[1]).toMatchObject({ key: 'steam:2', source: 'steam', subtitle: 'Steam' })
})
