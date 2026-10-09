jest.mock('psn-api', () => ({
  exchangeNpssoForAccessCode: jest.fn(),
  exchangeAccessCodeForAuthTokens: jest.fn(),
  exchangeRefreshTokenForAuthTokens: jest.fn(),
  makeUniversalSearch: jest.fn(),
  getUserTrophyProfileSummary: jest.fn(),
  getUserTitles: jest.fn(),
  getProfileFromAccountId: jest.fn(),
  getTitleTrophies: jest.fn(),
  getUserTrophiesEarnedForTitle: jest.fn(),
  getUserPlayedGames: jest.fn(),
  getUserTrophiesForSpecificTitle: jest.fn(),
  getTitleTrophyGroups: jest.fn(),
  getUserTrophyGroupEarningsForTitle: jest.fn(),
}))
jest.mock('@/lib/psnCredentials', () => ({
  loadPsnCredentials: jest.fn(async () => null),
  savePsnTokens: jest.fn(async () => {}),
  savePsnNpsso: jest.fn(async () => {}),
  npssoExpiry: jest.fn(async () => null),
}))
jest.mock('@/lib/steamCache', () => ({
  withSteamCache: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
  readCacheMany: jest.fn(async () => new Map()),
  writeCache: jest.fn(),
}))
jest.mock('@/lib/igdbClient', () => ({
  ...jest.requireActual('@/lib/igdbClient'),
  igdbConfigured: jest.fn(() => false),
  igdbArt: jest.fn(async () => null),
}))

import * as psn from 'psn-api'
import { igdbArt, igdbConfigured } from '@/lib/igdbClient'
import { readCacheMany, withSteamCache, writeCache } from '@/lib/steamCache'
import { loadPsnCredentials, savePsnNpsso, savePsnTokens } from '@/lib/psnCredentials'
import {
  durationMinutes,
  findPsnAccount,
  forgetPsnTokens,
  psnGameGroups,
  psnLanguage,
  psnReleaseYear,
  psnConfigured,
  psnFailure,
  psnGameTrophies,
  psnLatestTrophies,
  psnRecentTrophies,
  psnSummary,
  psnTitles,
  PsnError,
  withPlayData,
} from './psnClient'

const mock = (fn: unknown) => fn as jest.Mock

function search(...onlineIds: string[]) {
  return {
    domainResponses: [
      { results: onlineIds.map((onlineId, i) => ({ socialMetadata: { onlineId, accountId: `id-${i}` } })) },
    ],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.PSN_NPSSO = 'npsso'
  mock(psn.exchangeNpssoForAccessCode).mockResolvedValue('code')
  mock(psn.exchangeAccessCodeForAuthTokens).mockResolvedValue({
    accessToken: 'token',
    refreshToken: 'refresh',
    expiresIn: 3600,
    refreshTokenExpiresIn: 86400,
  })
  mock(psn.getUserTrophyProfileSummary).mockResolvedValue({
    trophyLevel: '412',
    tier: 5,
    progress: 40,
    earnedTrophies: { bronze: 100, silver: 30, gold: 10, platinum: 3 },
  })
  mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [], totalItemCount: 87 })
  mock(psn.getUserPlayedGames).mockResolvedValue({ titles: [] })
  mock(psn.getUserTrophiesForSpecificTitle).mockResolvedValue({ titles: [] })
  mock(psn.getProfileFromAccountId).mockResolvedValue({
    onlineId: 'Hakoom',
    aboutMe: 'hi',
    isPlus: true,
    avatars: [{ size: 's', url: 'http://x/small.png' }, { size: 'xl', url: 'http://x/big.png' }, { size: 'm', url: 'http://x/m.png' }],
  })
})

test('is configured with an NPSSO in the environment', async () => {
  expect(await psnConfigured()).toBe(true)
  process.env.PSN_NPSSO = '  '
  expect(await psnConfigured()).toBe(false)
})

test('finds the account whose online ID matches in any case, not just the first hit', async () => {
  mock(psn.makeUniversalSearch).mockResolvedValue(search('Hakoom_fan', 'hakoom'))
  expect(await findPsnAccount('HAKOOM')).toEqual({ accountId: 'id-1', onlineId: 'hakoom' })
})

test('returns null when nobody has that online ID', async () => {
  mock(psn.makeUniversalSearch).mockResolvedValue(search('someoneElse'))
  expect(await findPsnAccount('hakoom')).toBeNull()
})

test('reuses the access token instead of exchanging the NPSSO on every call', async () => {
  mock(psn.makeUniversalSearch).mockResolvedValue(search())
  await findPsnAccount('a1b')
  await findPsnAccount('a2b')
  // Earlier tests may already hold a token; either way, no more than one exchange.
  expect(mock(psn.exchangeNpssoForAccessCode).mock.calls.length).toBeLessThanOrEqual(1)
})

test('sums up level, trophies, games and the largest avatar', async () => {
  expect(await psnSummary('42', '7')).toEqual({
    onlineId: 'Hakoom',
    avatarUrl: 'https://x/big.png',
    aboutMe: 'hi',
    isPlus: true,
    tier: 5,
    levelProgress: 40,
    trophyLevel: 412,
    earned: { bronze: 100, silver: 30, gold: 10, platinum: 3 },
    games: 87,
  })
  expect(withSteamCache).toHaveBeenCalledWith('psn:summary:v3:42', expect.any(Number), expect.any(Function), {
    userId: '7',
  })
})

test('turns a Sony error body into a PsnError that knows a hidden profile', async () => {
  mock(psn.getUserTrophyProfileSummary).mockResolvedValue({
    error: { code: 2240526, message: 'Not permitted by access control' },
  })
  const err = await psnSummary('42').catch((e) => e)
  expect(err).toBeInstanceOf(PsnError)
  expect(err.isPrivate).toBe(true)
})

test('any other Sony error is not mistaken for a private profile', async () => {
  mock(psn.getUserTitles).mockResolvedValue({ error: { code: 500, message: 'Internal' } })
  const err = await psnSummary('42').catch((e) => e)
  expect(err).toBeInstanceOf(PsnError)
  expect(err.isPrivate).toBe(false)
})

const DAY = 24 * 60 * 60 * 1000
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString()

const title = (id: string, lastUpdated = '2026-01-01T00:00:00Z', progress = 50) => ({
  npCommunicationId: id,
  npServiceName: 'trophy2',
  trophyTitleName: `Game ${id}`,
  trophyTitleIconUrl: `http://img/${id}.png`,
  trophyTitlePlatform: 'PS5',
  progress,
  earnedTrophies: { bronze: 1, silver: 0, gold: 0, platinum: 0 },
  definedTrophies: { bronze: 2, silver: 0, gold: 0, platinum: 0 },
  lastUpdatedDateTime: lastUpdated,
})

test('walks every page of the trophy list, into the unified game model', async () => {
  mock(psn.getUserTitles)
    .mockResolvedValueOnce({ trophyTitles: [title('NPWR00001_00'), { ...title('BAD'), npCommunicationId: 'CUSA1' }], nextOffset: 800 })
    .mockResolvedValueOnce({ trophyTitles: [title('NPWR00002_00')] })
  const games = await psnTitles('42', '7')
  // An ID that is not NPWR cannot be numbered, so it is left out.
  expect(games.map((g) => g.titleId)).toEqual(['NPWR00001_00', 'NPWR00002_00'])
  expect(games[0]).toEqual({
    _source: 'psn',
    id: 100,
    titleId: 'NPWR00001_00',
    service: 'trophy2',
    title: 'Game NPWR00001_00',
    imageIcon: 'https://img/NPWR00001_00.png',
    consoleName: 'PS5',
    maxPossible: 2,
    numAwarded: 1,
    pctWon: 50,
    lastPlayed: '2026-01-01T00:00:00Z',
    earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 },
    defined: { bronze: 2, silver: 0, gold: 0, platinum: 0 },
    hasDlc: false,
    full: { earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 }, defined: { bronze: 2, silver: 0, gold: 0, platinum: 0 }, pctWon: 50 },
    lastTrophyAt: '2026-01-01T00:00:00Z',
    playtimeMinutes: null,
    playedAs: [],
    playCount: null,
    coverUrl: null,
    heroUrl: null,
    conceptId: null,
  })
  expect(mock(psn.getUserTitles).mock.calls[1][2]).toEqual({ limit: 800, offset: 800 })
})

function trophies() {
  mock(psn.getTitleTrophies).mockResolvedValue({
    trophies: [
      { trophyId: 0, trophyType: 'platinum', trophyName: 'All', trophyDetail: 'Everything', trophyIconUrl: 'http://p.png', trophyHidden: false },
      { trophyId: 1, trophyType: 'bronze', trophyName: 'Secret', trophyHidden: true },
    ],
  })
  mock(psn.getUserTrophiesEarnedForTitle).mockResolvedValue({
    trophies: [
      { trophyId: 0, earned: true, earnedDateTime: ago(1), trophyEarnedRate: '3.4' },
      { trophyId: 1, earned: false, trophyEarnedRate: '' },
    ],
  })
}

test("merges a game's trophies with what the account earned, cached until the game changes", async () => {
  trophies()
  const game = { titleId: 'NPWR00001_00', service: 'trophy' as const, lastTrophyAt: '2026-01-01T00:00:00Z' }
  const list = await psnGameTrophies('42', game, '7')
  expect(list[0]).toMatchObject({ id: 0, name: 'All', iconUrl: 'https://p.png', type: 'platinum', earned: true, rarity: 3.4 })
  expect(list[1]).toEqual({ id: 1, name: 'Secret', detail: '', iconUrl: null, type: 'bronze', groupId: 'default', hidden: true, earned: false, earnedAt: null, rarity: null })
  expect(mock(psn.getTitleTrophies).mock.calls[0].slice(1)).toEqual([
    'NPWR00001_00',
    'all',
    { npServiceName: 'trophy', headerOverrides: { 'Accept-Language': 'en-US' } },
  ])
  expect(withSteamCache).toHaveBeenCalledWith(
    'psn:trophies:v2:42:NPWR00001_00:2026-01-01T00:00:00Z:en-US',
    expect.any(Number),
    expect.any(Function),
    { userId: '7' },
  )
})

test('recent trophies come only from games played inside the window, newest first', async () => {
  trophies()
  mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [title('NPWR00001_00', ago(2)), title('NPWR00002_00', ago(90))] })
  const recent = await psnRecentTrophies('42', 60, '7')
  // The old game is never asked for.
  expect(mock(psn.getTitleTrophies)).toHaveBeenCalledTimes(1)
  expect(recent).toHaveLength(1)
  expect(recent[0]).toMatchObject({ gameId: 100, titleId: 'NPWR00001_00', gameTitle: 'Game NPWR00001_00', trophyId: 0, type: 'platinum' })
})

test('the latest trophies look at the last few games with something earned, however old', async () => {
  trophies()
  mock(psn.getUserTitles).mockResolvedValue({
    trophyTitles: [
      { ...title('NPWR00009_00', ago(1)), earnedTrophies: { bronze: 0, silver: 0, gold: 0, platinum: 0 } },
      title('NPWR00001_00', ago(400)),
    ],
  })
  const latest = await psnLatestTrophies('42', '7')
  expect(mock(psn.getTitleTrophies)).toHaveBeenCalledTimes(1)
  expect(latest.map((t) => t.titleId)).toEqual(['NPWR00001_00'])
})

test('psnFailure: 403 for a hidden profile, 502 otherwise', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(psnFailure(new PsnError('x', 2240526), 'test').status).toBe(403)
  expect(psnFailure(new Error('boom'), 'test').status).toBe(502)
  ;(console.error as jest.Mock).mockRestore()
})

test.each([
  ['PT43H19M14S', 2599],
  ['PT39M28S', 39],
  ['P1DT2H', 1560],
  ['PT0S', 0],
  [undefined, null],
  ['soon', null],
])('%s is %s minutes', (iso, minutes) => {
  expect(durationMinutes(iso)).toBe(minutes)
})

const played = (titleId: string, lastPlayedDateTime: string, playDuration: string, images: { type: string; url: string }[] = []) => ({
  titleId, name: titleId, lastPlayedDateTime, playDuration, playCount: 3, concept: { media: { images } },
})

test('play time, last session and store art come from the played-games list, matched by trophy set', async () => {
  mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [title('NPWR00001_00', '2026-01-01T00:00:00Z'), title('NPWR00002_00', '2026-03-01T00:00:00Z')] })
  mock(psn.getUserPlayedGames).mockResolvedValue({
    titles: [
      played('CUSA1', '2026-06-01T00:00:00Z', 'PT10H', [
        { type: 'PORTRAIT_BANNER', url: 'http://cover.png' },
        { type: 'BACKGROUND_LAYER_ART', url: 'https://hero.png' },
      ]),
    ],
  })
  mock(psn.getUserTrophiesForSpecificTitle).mockResolvedValue({
    titles: [{ npTitleId: 'CUSA1', trophyTitles: [{ npCommunicationId: 'NPWR00001_00' }] }],
  })
  const games = await psnTitles('42', '7')
  // The session moves the game above one with a newer trophy.
  expect(games.map((g) => g.titleId)).toEqual(['NPWR00001_00', 'NPWR00002_00'])
  expect(games[0]).toMatchObject({
    lastPlayed: '2026-06-01T00:00:00Z',
    lastTrophyAt: '2026-01-01T00:00:00Z',
    playtimeMinutes: 600,
    playCount: 3,
    playedAs: ['CUSA1'],
    coverUrl: 'https://cover.png',
    heroUrl: 'https://hero.png',
  })
  expect(games[1].playtimeMinutes).toBeNull()
  expect(writeCache).toHaveBeenCalledWith('psn:sets:CUSA1', ['NPWR00001_00'], expect.any(Number), '7')
})

test('the trophy-set lookup goes five ids at a time, and skips what is cached', async () => {
  mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [] })
  mock(psn.getUserPlayedGames).mockResolvedValue({
    titles: Array.from({ length: 12 }, (_, i) => played(`CUSA${i}`, '2026-01-01T00:00:00Z', 'PT1H')),
  })
  mock(readCacheMany).mockResolvedValueOnce(new Map([['psn:sets:CUSA0', []]]))
  await psnTitles('42')
  const batches = mock(psn.getUserTrophiesForSpecificTitle).mock.calls.map((c) => c[2].npTitleIds.split(',').length)
  expect(batches).toEqual([5, 5, 1])
})

test('a hidden played-games list leaves the trophies as they are', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [title('NPWR00001_00')] })
  mock(psn.getUserPlayedGames).mockRejectedValue(new Error('Not permitted'))
  const games = await psnTitles('42')
  expect(games).toHaveLength(1)
  expect(games[0].playtimeMinutes).toBeNull()
  ;(console.error as jest.Mock).mockRestore()
})

test('a collection puts its time on each of its trophy lists; two versions of one game add up', () => {
  const base = {
    _source: 'psn' as const, service: 'trophy' as const, title: '', imageIcon: '', consoleName: 'PS4', maxPossible: 1, numAwarded: 0,
    pctWon: 0, lastPlayed: null, earned: { bronze: 0, silver: 0, gold: 0, platinum: 0 }, defined: { bronze: 1, silver: 0, gold: 0, platinum: 0 },
    lastTrophyAt: null, playtimeMinutes: null, playedAs: [], playCount: null, coverUrl: null, heroUrl: null,
  }
  const games = withPlayData(
    [{ ...base, id: 1, titleId: 'NPWR00000_01' }, { ...base, id: 2, titleId: 'NPWR00000_02' }, { ...base, id: 3, titleId: 'NPWR00000_03' }],
    [
      { titleId: 'COLL', lastPlayed: '2026-01-01T00:00:00Z', playtimeMinutes: 100, playCount: 1, coverUrl: null, heroUrl: null },
      { titleId: 'PS4V', lastPlayed: '2026-01-01T00:00:00Z', playtimeMinutes: 30, playCount: 1, coverUrl: null, heroUrl: null },
      { titleId: 'PS5V', lastPlayed: '2026-02-01T00:00:00Z', playtimeMinutes: 20, playCount: 2, coverUrl: 'c', heroUrl: null },
    ],
    new Map([['COLL', ['NPWR00000_01', 'NPWR00000_02']], ['PS4V', ['NPWR00000_03']], ['PS5V', ['NPWR00000_03']]]),
  )
  const byId = new Map(games.map((g) => [g.id, g]))
  expect(byId.get(1)).toMatchObject({ playtimeMinutes: 100, playedAs: ['COLL'] })
  expect(byId.get(2)).toMatchObject({ playtimeMinutes: 100, playedAs: ['COLL'] })
  expect(byId.get(3)).toMatchObject({ playtimeMinutes: 50, playCount: 3, lastPlayed: '2026-02-01T00:00:00Z', coverUrl: 'c', playedAs: ['PS4V', 'PS5V'] })
})

describe('sign-in', () => {
  beforeEach(() => forgetPsnTokens())

  test('reuses the tokens another instance stored, without spending the NPSSO', async () => {
    mock(loadPsnCredentials).mockResolvedValueOnce({
      npsso: 'stored', npssoExpiresAt: null, updatedAt: null, updatedBy: null, warnedAt: null,
      tokens: { accessToken: 'stored-access', accessExpiresAt: Date.now() + 3_600_000, refreshToken: 'r', refreshExpiresAt: Date.now() + 864_000_000 },
    })
    mock(psn.makeUniversalSearch).mockResolvedValue(search())
    await findPsnAccount('abc')
    expect(psn.exchangeNpssoForAccessCode).not.toHaveBeenCalled()
    expect(mock(psn.makeUniversalSearch).mock.calls[0][0]).toEqual({ accessToken: 'stored-access' })
  })

  test('an expired access token is refreshed and stored, keeping the refresh deadline Sony set', async () => {
    const refreshDeadline = Date.now() + 5 * 86_400_000
    mock(loadPsnCredentials).mockResolvedValueOnce({
      npsso: 'stored', npssoExpiresAt: null, updatedAt: null, updatedBy: null, warnedAt: null,
      tokens: { accessToken: 'old', accessExpiresAt: Date.now() - 1, refreshToken: 'r', refreshExpiresAt: refreshDeadline },
    })
    mock(psn.exchangeRefreshTokenForAuthTokens).mockResolvedValue({ accessToken: 'new', refreshToken: 'r', expiresIn: 3600, refreshTokenExpiresIn: 864000 })
    mock(psn.makeUniversalSearch).mockResolvedValue(search())
    await findPsnAccount('abc')
    expect(psn.exchangeNpssoForAccessCode).not.toHaveBeenCalled()
    expect(mock(savePsnTokens).mock.calls[0][0]).toMatchObject({ accessToken: 'new', refreshExpiresAt: refreshDeadline })
  })

  test('the stored NPSSO wins over the variable; the variable is stored on first use', async () => {
    mock(psn.makeUniversalSearch).mockResolvedValue(search())
    mock(loadPsnCredentials).mockResolvedValueOnce({ npsso: 'from-admin', npssoExpiresAt: null, tokens: null, updatedAt: null, updatedBy: null, warnedAt: null })
    await findPsnAccount('abc')
    expect(psn.exchangeNpssoForAccessCode).toHaveBeenLastCalledWith('from-admin')

    forgetPsnTokens()
    mock(loadPsnCredentials).mockResolvedValueOnce(null)
    await findPsnAccount('abc')
    expect(psn.exchangeNpssoForAccessCode).toHaveBeenLastCalledWith('npsso')
    expect(savePsnNpsso).toHaveBeenCalledWith('npsso', null, 'PSN_NPSSO')
  })

  test('configured by a stored NPSSO even without the variable', async () => {
    process.env.PSN_NPSSO = ''
    mock(loadPsnCredentials).mockResolvedValueOnce({ npsso: 'x' })
    expect(await psnConfigured()).toBe(true)
    mock(loadPsnCredentials).mockResolvedValueOnce(null)
    expect(await psnConfigured()).toBe(false)
  })
})

test('the app language picks the language Sony is asked in', () => {
  expect(psnLanguage('es')).toBe('es-ES')
  expect(psnLanguage('ja')).toBe('ja-JP')
  expect(psnLanguage('xx')).toBe('en-US')
  expect(psnLanguage(null)).toBe('en-US')
})

describe('DLC', () => {
  const groups = () => {
    mock(psn.getTitleTrophyGroups).mockResolvedValue({
      trophyGroups: [
        { trophyGroupId: 'default', trophyGroupName: 'Saints Row IV', trophyGroupIconUrl: 'http://g0.png', definedTrophies: { bronze: 10, silver: 2, gold: 1, platinum: 1 } },
        { trophyGroupId: '001', trophyGroupName: 'Enter the Dominatrix', trophyGroupIconUrl: '', definedTrophies: { bronze: 5, silver: 0, gold: 0, platinum: 0 } },
      ],
    })
    mock(psn.getUserTrophyGroupEarningsForTitle).mockResolvedValue({
      trophyGroups: [
        { trophyGroupId: 'default', progress: 100, earnedTrophies: { bronze: 10, silver: 2, gold: 1, platinum: 1 } },
        { trophyGroupId: '001', progress: 0, earnedTrophies: { bronze: 0, silver: 0, gold: 0, platinum: 0 } },
      ],
    })
  }

  test("a game's groups: the base game and each DLC, named in the asked language", async () => {
    groups()
    const list = await psnGameGroups('42', { titleId: 'NPWR07410_00', service: 'trophy', lastTrophyAt: 'x' }, '7', 'es-ES')
    expect(list).toEqual([
      { id: 'default', name: 'Saints Row IV', iconUrl: 'https://g0.png', defined: { bronze: 10, silver: 2, gold: 1, platinum: 1 }, earned: { bronze: 10, silver: 2, gold: 1, platinum: 1 }, progress: 100 },
      { id: '001', name: 'Enter the Dominatrix', iconUrl: null, defined: { bronze: 5, silver: 0, gold: 0, platinum: 0 }, earned: { bronze: 0, silver: 0, gold: 0, platinum: 0 }, progress: 0 },
    ])
    expect(mock(psn.getTitleTrophyGroups).mock.calls[0][2]).toEqual({ npServiceName: 'trophy', headerOverrides: { 'Accept-Language': 'es-ES' } })
  })

  test('a game with DLC counts by its base game: the platinum makes it complete', async () => {
    groups()
    mock(psn.getUserTitles).mockResolvedValue({
      trophyTitles: [{ ...title('NPWR07410_00'), hasTrophyGroups: true, progress: 80, earnedTrophies: { bronze: 10, silver: 2, gold: 1, platinum: 1 }, definedTrophies: { bronze: 15, silver: 2, gold: 1, platinum: 1 } }],
    })
    const [game] = await psnTitles('42')
    expect(game).toMatchObject({ hasDlc: true, pctWon: 100, numAwarded: 14, maxPossible: 14 })
    expect(game.full).toEqual({ earned: { bronze: 10, silver: 2, gold: 1, platinum: 1 }, defined: { bronze: 15, silver: 2, gold: 1, platinum: 1 }, pctWon: 80 })
  })

  test('a failed group lookup keeps the whole-set numbers', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mock(psn.getTitleTrophyGroups).mockResolvedValue({ error: { code: 500, message: 'down' } })
    mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [{ ...title('NPWR07410_00'), hasTrophyGroups: true, progress: 80 }] })
    const [game] = await psnTitles('42')
    expect(game.pctWon).toBe(80)
    ;(console.error as jest.Mock).mockRestore()
  })
})

test('the release year comes from the PlayStation Store page', async () => {
  ;(global.fetch as unknown) = jest.fn().mockResolvedValue({ ok: true, text: async () => '..."releaseDate":"2016-11-15T05:00:00Z"...' })
  expect(await psnReleaseYear(225519)).toBe(2016)
  expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('https://store.playstation.com/en-us/concept/225519')
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, text: async () => 'no date here' })
  expect(await psnReleaseYear(1)).toBeNull()
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404, text: async () => '' })
  await expect(psnReleaseYear(2)).rejects.toThrow()
})

test('PS3/Vita games take their cover and backdrop from IGDB; a failed lookup leaves them as they were', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  mock(igdbConfigured).mockReturnValue(true)
  mock(igdbArt).mockImplementation(async (name: string) => {
    if (name === 'Game NPWR00002_00') throw new Error('igdb down')
    return { coverUrl: 'https://igdb/cover.jpg', heroUrl: 'https://igdb/hero.jpg', releaseYear: 2010 }
  })
  mock(psn.getUserTitles).mockResolvedValue({
    trophyTitles: [
      { ...title('NPWR00001_00'), trophyTitlePlatform: 'PS3' },
      { ...title('NPWR00002_00'), trophyTitlePlatform: 'PSVITA' },
      title('NPWR00003_00'),
    ],
  })
  mock(psn.getUserPlayedGames).mockResolvedValue({ titles: [] })
  const games = await psnTitles('42')
  expect(games[0]).toMatchObject({ coverUrl: 'https://igdb/cover.jpg', heroUrl: 'https://igdb/hero.jpg' })
  expect(games[1]).toMatchObject({ coverUrl: null, heroUrl: null })
  // A PS5 game is never looked up: the Store has its art.
  expect(igdbArt).toHaveBeenCalledTimes(2)
  expect(igdbArt).toHaveBeenCalledWith('Game NPWR00001_00', 'PS3')
  expect(igdbArt).toHaveBeenCalledWith('Game NPWR00002_00', 'PS Vita')
  expect(games[1].consoleName).toBe('PS Vita')
  mock(igdbConfigured).mockReturnValue(false)
  ;(console.error as jest.Mock).mockRestore()
})
