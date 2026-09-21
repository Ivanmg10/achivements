import {
  unixToIso,
  toSteamGameProgress,
  withAchievementCounts,
  toSteamAchievements,
  withPlayerAchievementCounts,
  toGlobalPctMap,
  toSteamGameDetails,
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
      { earned: true },
      { earned: false },
      { earned: true },
      { earned: false },
    ] as never)

    expect(result.maxPossible).toBe(4)
    expect(result.numAwarded).toBe(2)
    expect(result.pctWon).toBe(50)
  })

  test('rounds the percentage to two decimals', () => {
    const result = withAchievementCounts(base, [
      { earned: true }, { earned: false }, { earned: false },
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
      description: 'Win your first match', earned: true, dateEarned: '2023-11-14T22:13:20.000Z',
      badgeUrl: 'icon.jpg', displayOrder: 0, hidden: false, globalPct: null,
    })
    expect(secret.earned).toBe(false)
    expect(secret.dateEarned).toBeNull()
    // Colour badge even when locked — the UI greys it out, as RA does.
    expect(secret.badgeUrl).toBe('icon2.jpg')
    expect(secret.hidden).toBe(true)
    expect(secret.description).toBe('')
  })

  test('renders the full list from the schema alone when the player has no data', () => {
    const result = toSteamAchievements(schema, [])
    expect(result).toHaveLength(2)
    expect(result.every((a) => !a.earned && a.dateEarned === null)).toBe(true)
    expect(result.map((a) => a.badgeUrl)).toEqual(['icon.jpg', 'icon2.jpg'])
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
    // Unlocked before Steam kept timestamps: still earned, just undated.
    expect(result[0].earned).toBe(true)
    expect(result[0].dateEarned).toBeNull()
  })

  test('attaches global rarity by api name', () => {
    const result = toSteamAchievements(schema, [], new Map([['ACH_WIN', 83.3]]))
    expect(result[0].globalPct).toBe(83.3)
    expect(result[1].globalPct).toBeNull()
  })

  test('an earned-but-undated achievement still counts as earned', () => {
    const [a] = toSteamAchievements(schema, [{ apiname: 'ACH_WIN', achieved: 1, unlocktime: 0 }])
    expect(withAchievementCounts(toSteamGameProgress(GAME), [a]).numAwarded).toBe(1)
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

describe('toGlobalPctMap', () => {
  test('parses the string percents the live API sends', () => {
    const map = toGlobalPctMap({ achievementpercentages: { achievements: [
      { name: 'A', percent: '83.3' },
      { name: 'B', percent: 4.2 },
    ] } })
    expect([...map]).toEqual([['A', 83.3], ['B', 4.2]])
  })

  test('drops unparseable values instead of producing NaN', () => {
    const map = toGlobalPctMap({ achievementpercentages: { achievements: [{ name: 'A', percent: 'n/a' }] } })
    expect(map.size).toBe(0)
  })

  test('handles a missing payload', () => {
    expect(toGlobalPctMap(null).size).toBe(0)
    expect(toGlobalPctMap({}).size).toBe(0)
  })
})

describe('toSteamGameDetails', () => {
  const RESPONSE = {
    '377160': {
      success: true,
      data: {
        name: 'Fallout 4',
        developers: ['Bethesda Game Studios'],
        publishers: ['Bethesda Softworks'],
        genres: [{ id: '3', description: 'Rol' }],
        release_date: { coming_soon: false, date: '9 NOV 2015' },
        short_description: 'Desc',
        screenshots: [{ id: 0, path_thumbnail: 't.jpg', path_full: 'f.jpg' }],
      },
    },
  }

  test('flattens the store payload for the requested app', () => {
    expect(toSteamGameDetails(377160, RESPONSE)).toEqual({
      appId: 377160,
      name: 'Fallout 4',
      developers: ['Bethesda Game Studios'],
      publishers: ['Bethesda Softworks'],
      genres: ['Rol'],
      releaseDate: '9 NOV 2015',
      description: 'Desc',
      screenshots: [{ thumb: 't.jpg', full: 'f.jpg' }],
    })
  })

  test('fills empty fields when the store omits them', () => {
    const d = toSteamGameDetails(1, { '1': { success: true, data: { name: 'Bare' } } })
    expect(d).toMatchObject({ developers: [], publishers: [], genres: [], releaseDate: null, description: null, screenshots: [] })
  })

  test('returns null when Steam has no store entry (delisted, or success false)', () => {
    expect(toSteamGameDetails(1, { '1': { success: false } })).toBeNull()
    expect(toSteamGameDetails(2, RESPONSE)).toBeNull()
    expect(toSteamGameDetails(1, null)).toBeNull()
  })
})
