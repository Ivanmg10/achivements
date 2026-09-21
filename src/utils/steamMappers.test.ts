import {
  unixToIso,
  toSteamGameProgress,
  withAchievementCounts,
  toSteamAchievements,
  withPlayerAchievementCounts,
  STEAM_PLATFORM,
} from './steamMappers'
import type { SteamOwnedGame, SteamSchemaAchievement, SteamPlayerAchievement } from '@/types/steam'

const GAME: SteamOwnedGame = {
  appid: 730,
  name: 'Counter-Strike 2',
  playtime_forever: 51234,
  playtime_2weeks: 120,
  img_icon_url: 'iconhash',
  img_logo_url: 'logohash',
  has_community_visible_stats: true,
  rtime_last_played: 1700000000,
}

describe('unixToIso', () => {
  test('converts seconds to ISO', () => {
    expect(unixToIso(1700000000)).toBe('2023-11-14T22:13:20.000Z')
  })

  test('treats 0, undefined and negatives as never played', () => {
    expect(unixToIso(0)).toBeNull()
    expect(unixToIso(undefined)).toBeNull()
    expect(unixToIso(-5)).toBeNull()
  })
})

describe('toSteamGameProgress', () => {
  test('maps the wire format onto the unified shape', () => {
    expect(toSteamGameProgress(GAME)).toEqual({
      _source: 'steam',
      id: 730,
      title: 'Counter-Strike 2',
      imageIcon: 'https://media.steampowered.com/steamcommunity/public/images/apps/730/iconhash.jpg',
      consoleName: STEAM_PLATFORM,
      maxPossible: 0,
      numAwarded: 0,
      pctWon: 0,
      lastPlayed: '2023-11-14T22:13:20.000Z',
      playtimeForever: 51234,
      playtime2Weeks: 120,
      imgLogoUrl: 'https://media.steampowered.com/steamcommunity/public/images/apps/730/logohash.jpg',
      hasStats: true,
      achievementsLoaded: false,
    })
  })

  test('fills in defaults when Steam omits optional fields', () => {
    const sparse = toSteamGameProgress({ appid: 999, playtime_forever: 0 })
    expect(sparse.title).toBe('App 999')
    expect(sparse.imageIcon).toBe('')
    expect(sparse.imgLogoUrl).toBe('')
    expect(sparse.playtime2Weeks).toBe(0)
    expect(sparse.lastPlayed).toBeNull()
    expect(sparse.hasStats).toBe(false)
  })

  test('treats a missing has_community_visible_stats as no stats', () => {
    expect(toSteamGameProgress({ ...GAME, has_community_visible_stats: undefined }).hasStats).toBe(false)
  })
})

describe('withAchievementCounts', () => {
  const base = toSteamGameProgress(GAME)

  test('counts earned achievements and the percentage', () => {
    const result = withAchievementCounts(base, [
      { dateEarned: '2023-01-01T00:00:00.000Z' },
      { dateEarned: null },
      { dateEarned: '2023-01-02T00:00:00.000Z' },
      { dateEarned: null },
    ] as never)

    expect(result.maxPossible).toBe(4)
    expect(result.numAwarded).toBe(2)
    expect(result.pctWon).toBe(50)
  })

  test('rounds the percentage to two decimals', () => {
    const result = withAchievementCounts(base, [
      { dateEarned: 'x' }, { dateEarned: null }, { dateEarned: null },
    ] as never)
    expect(result.pctWon).toBe(33.33)
  })

  test('avoids dividing by zero for a game with no achievements', () => {
    const result = withAchievementCounts(base, [])
    expect(result.maxPossible).toBe(0)
    expect(result.pctWon).toBe(0)
  })
})

describe('toSteamAchievements', () => {
  const schema: SteamSchemaAchievement[] = [
    { name: 'ACH_WIN', defaultvalue: 0, displayName: 'Win a Match', hidden: 0,
      description: 'Win your first match', icon: 'icon.jpg', icongray: 'gray.jpg' },
    { name: 'ACH_SECRET', defaultvalue: 0, displayName: 'Secret', hidden: 1,
      icon: 'icon2.jpg', icongray: 'gray2.jpg' },
  ]

  test('marks unlocked achievements with their date and colour badge', () => {
    const player: SteamPlayerAchievement[] = [
      { apiname: 'ACH_WIN', achieved: 1, unlocktime: 1700000000 },
      { apiname: 'ACH_SECRET', achieved: 0, unlocktime: 0 },
    ]
    const [win, secret] = toSteamAchievements(schema, player)

    expect(win).toEqual({
      _source: 'steam', id: 'ACH_WIN', apiname: 'ACH_WIN', title: 'Win a Match',
      description: 'Win your first match', dateEarned: '2023-11-14T22:13:20.000Z',
      badgeUrl: 'icon.jpg', displayOrder: 0, hidden: false,
    })
    expect(secret.dateEarned).toBeNull()
    expect(secret.badgeUrl).toBe('gray2.jpg')
    expect(secret.hidden).toBe(true)
    expect(secret.description).toBe('')
  })

  test('renders the full list from the schema alone when the player has no data', () => {
    const result = toSteamAchievements(schema, [])
    expect(result).toHaveLength(2)
    expect(result.every((a) => a.dateEarned === null)).toBe(true)
    expect(result.map((a) => a.badgeUrl)).toEqual(['gray.jpg', 'gray2.jpg'])
  })

  test('ignores player entries with no matching schema definition', () => {
    const result = toSteamAchievements(schema, [
      { apiname: 'ACH_GONE', achieved: 1, unlocktime: 1700000000 },
    ])
    expect(result).toHaveLength(2)
    expect(result.every((a) => a.dateEarned === null)).toBe(true)
  })

  test('falls back to the api name when the schema has no display name', () => {
    const result = toSteamAchievements(
      [{ name: 'ACH_X', defaultvalue: 0, displayName: '', hidden: 0, icon: 'i', icongray: 'g' }],
      [],
    )
    expect(result[0].title).toBe('ACH_X')
  })

  test('treats an unlock with achieved=1 but no timestamp as earned with no date', () => {
    const result = toSteamAchievements(schema, [{ apiname: 'ACH_WIN', achieved: 1, unlocktime: 0 }])
    expect(result[0].dateEarned).toBeNull()
    expect(result[0].badgeUrl).toBe('icon.jpg')
  })
})

describe('withPlayerAchievementCounts', () => {
  const base = toSteamGameProgress(GAME)

  test('counts from the unlock list alone', () => {
    const result = withPlayerAchievementCounts(base, [
      { apiname: 'A', achieved: 1, unlocktime: 1 },
      { apiname: 'B', achieved: 0, unlocktime: 0 },
      { apiname: 'C', achieved: 1, unlocktime: 1 },
    ])
    expect(result).toMatchObject({ maxPossible: 3, numAwarded: 2, pctWon: 66.67, achievementsLoaded: true })
  })

  test('leaves the game unloaded on an empty list — unknown, not zero', () => {
    expect(withPlayerAchievementCounts(base, [])).toBe(base)
  })
})

test('a freshly mapped game is not yet loaded; counting marks it loaded', () => {
  const base = toSteamGameProgress(GAME)
  expect(base.achievementsLoaded).toBe(false)
  expect(withAchievementCounts(base, []).achievementsLoaded).toBe(true)
})
