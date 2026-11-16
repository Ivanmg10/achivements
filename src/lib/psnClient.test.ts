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
jest.mock('@/lib/attemptLimit', () => ({ reserveAttempt: jest.fn(async () => ({ allowed: true, release: async () => {} })) }))
jest.mock('@/lib/psnAccounts', () => jest.requireActual('@/test-utils/fakePsnAccounts').fakePsnStore)
jest.mock('@/lib/psnMaintenance', () => ({ maybeMaintainPsnPool: jest.fn() }))
jest.mock('@/lib/steamCache', () => ({
  withSteamCache: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
  readCacheMany: jest.fn(async () => new Map()),
  readCache: jest.fn(async () => null),
  writeCache: jest.fn(),
}))
jest.mock('@/lib/igdbClient', () => ({
  ...jest.requireActual('@/lib/igdbClient'),
  igdbConfigured: jest.fn(() => false),
  igdbArt: jest.fn(async () => null),
}))

import * as psn from 'psn-api'
import { igdbArt, igdbConfigured } from '@/lib/igdbClient'
import { readCache, readCacheMany, withSteamCache, writeCache } from '@/lib/steamCache'
import { fakePsnStore } from '@/test-utils/fakePsnAccounts'
import {
  durationMinutes,
  fetchPsnEnrichment,
  fetchPsnGame,
  fetchPsnSummary,
  fetchPsnTitles,
  findPsnAccount,
  forgetPsnTokens,
  psnLanguage,
  psnReleaseYear,
  psnConfigured,
  psnFailure,
  psnAboutMe,
  PsnError,
  PsnBusyError,
  PsnSyncing,
  withEnrichment,
  withPlayData,
  psnCall,
} from './psnClient'
import type { KnownSet } from './psnStore'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { psnCallTotals, resetPsnCallStats } from './psnCallStats'

const mock = (fn: unknown) => fn as jest.Mock

/** What the worker builds: the trophy list with one enrichment pass laid over it. */
async function psnLibrary(accountId: string) {
  const core = await fetchPsnTitles(accountId)
  return withEnrichment(core, await fetchPsnEnrichment(accountId, core))
}

function search(...onlineIds: string[]) {
  return {
    domainResponses: [
      { results: onlineIds.map((onlineId, i) => ({ socialMetadata: { onlineId, accountId: `id-${i}` } })) },
    ],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  fakePsnStore.reset()
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

test('is configured while the pool has an account with a sign-in', async () => {
  expect(await psnConfigured()).toBe(true)
  fakePsnStore.reset([])
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

test('the headline numbers with the profile and the largest avatar: 2 requests', async () => {
  resetPsnCallStats()
  expect(await fetchPsnSummary('42', null)).toEqual({
    summary: {
      onlineId: 'Hakoom',
      avatarUrl: 'https://x/big.png',
      aboutMe: 'hi',
      isPlus: true,
      tier: 5,
      levelProgress: 40,
      trophyLevel: 412,
      earned: { bronze: 100, silver: 30, gold: 10, platinum: 3 },
    },
    withProfile: true,
  })
  expect(psnCallTotals()).toMatchObject({ summary: 1, profile: 1 })
  // No title list for the count: the store has the games.
  expect(mock(psn.getUserTitles)).not.toHaveBeenCalled()
})

test('nothing moved since the last read: 1 request, the profile kept as it was', async () => {
  const known = (await fetchPsnSummary('42', null)).summary
  mock(psn.getProfileFromAccountId).mockClear()
  mock(psn.getUserTrophyProfileSummary).mockResolvedValue({ trophyLevel: '413', tier: 5, progress: 41, earnedTrophies: known.earned })
  expect(await fetchPsnSummary('42', { ...known, onlineId: 'Kept' })).toEqual({ summary: { ...known, onlineId: 'Kept', trophyLevel: 413, levelProgress: 41 }, withProfile: false })
  expect(psn.getProfileFromAccountId).not.toHaveBeenCalled()
  // A new trophy: the profile is read with it.
  mock(psn.getUserTrophyProfileSummary).mockResolvedValue({ trophyLevel: '413', tier: 5, progress: 41, earnedTrophies: { ...known.earned, bronze: 101 } })
  expect((await fetchPsnSummary('42', known)).withProfile).toBe(true)
})

test('reads About Me fresh, counted as a profile call; a missing one is an empty string', async () => {
  resetPsnCallStats()
  expect(await psnAboutMe('42')).toBe('hi')
  mock(psn.getProfileFromAccountId).mockResolvedValue({ onlineId: 'Hakoom' })
  expect(await psnAboutMe('42')).toBe('')
  expect(psn.getProfileFromAccountId).toHaveBeenCalledTimes(2)
  expect(psnCallTotals().profile).toBe(2)
  expect(withSteamCache).not.toHaveBeenCalled()
})

test('turns a Sony error body into a PsnError that knows a hidden profile', async () => {
  mock(psn.getUserTrophyProfileSummary).mockResolvedValue({
    error: { code: 2240526, message: 'Not permitted by access control' },
  })
  const err = await fetchPsnSummary('42', null).catch((e) => e)
  expect(err).toBeInstanceOf(PsnError)
  expect(err.isPrivate).toBe(true)
})

test('any other Sony error is not mistaken for a private profile', async () => {
  mock(psn.getUserTitles).mockResolvedValue({ error: { code: 500, message: 'Internal' } })
  const err = await fetchPsnTitles('42').catch((e) => e)
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
  const games = await fetchPsnTitles('42')
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
    lastTrophyAt: '2026-01-01T00:00:00Z',
    playtimeMinutes: null,
    playedAs: [],
    playCount: null,
    coverUrl: null,
    heroUrl: null,
    conceptId: null,
    collection: null,
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

const GAME = { ...psnGameFixture({ titleId: 'NPWR00001_00', service: 'trophy', lastTrophyAt: '2026-01-01T00:00:00Z' }), numAwarded: 1, hasDlc: false }
const NOTHING_KNOWN: KnownSet = { languages: [], groupLanguages: [], known: [] }

test("a game never read: its definitions in the asked language and the account's earned trophies, 2 requests", async () => {
  trophies()
  resetPsnCallStats()
  const snap = await fetchPsnGame('42', GAME, NOTHING_KNOWN, 'es-ES')
  expect(snap).toMatchObject({ titleId: 'NPWR00001_00', lastTrophyAt: '2026-01-01T00:00:00Z', language: 'es-ES', groupDefs: null, groupsEarned: null })
  expect(snap.defined).toEqual([
    { id: 0, name: 'All', detail: 'Everything', iconUrl: 'https://p.png', type: 'platinum', groupId: 'default', hidden: false },
    { id: 1, name: 'Secret', detail: '', iconUrl: null, type: 'bronze', groupId: 'default', hidden: true },
  ])
  // Only what was earned is the account's; the rarity is everyone's.
  expect(snap.earned).toEqual([{ id: 0, earnedAt: expect.any(String) }])
  expect(snap.rarity).toEqual([{ id: 0, rarity: 3.4 }, { id: 1, rarity: null }])
  expect(mock(psn.getTitleTrophies).mock.calls[0].slice(1)).toEqual(['NPWR00001_00', 'all', { npServiceName: 'trophy', headerOverrides: { 'Accept-Language': 'es-ES' } }])
  expect(psnCallTotals()).toMatchObject({ gameTrophies: 2 })
})

test('definitions already stored in that language are not read again: 1 request; a DLC id they lack reads them again', async () => {
  trophies()
  const known: KnownSet = { languages: ['es-ES'], groupLanguages: [], known: [{ id: 0, type: 'platinum', groupId: 'default' }, { id: 1, type: 'bronze', groupId: 'default' }] }
  expect((await fetchPsnGame('42', GAME, known, 'es-ES')).defined).toBeNull()
  expect(psn.getTitleTrophies).not.toHaveBeenCalled()
  mock(psn.getUserTrophiesEarnedForTitle).mockResolvedValue({ trophies: [{ trophyId: 0, earned: true }, { trophyId: 7, earned: false }] })
  expect((await fetchPsnGame('42', GAME, known, 'es-ES')).defined).not.toBeNull()
  // Another language reads them too.
  mock(psn.getTitleTrophies).mockClear()
  trophies()
  await fetchPsnGame('42', GAME, known, 'fr-FR')
  expect(psn.getTitleTrophies).toHaveBeenCalledTimes(1)
})

test('a game never started asks for no earned trophies', async () => {
  trophies()
  const snap = await fetchPsnGame('42', { ...GAME, numAwarded: 0 }, NOTHING_KNOWN, 'en-US')
  expect(psn.getUserTrophiesEarnedForTitle).not.toHaveBeenCalled()
  expect(snap.earned).toEqual([])
})

test("a complete game with DLC gets its base game's completion date, from the stored definitions when none were read", async () => {
  mock(psn.getUserTrophiesEarnedForTitle).mockResolvedValue({ trophies: [{ trophyId: 0, earned: true, earnedDateTime: '2025-05-01T10:00:00Z' }] })
  mock(psn.getUserTrophyGroupEarningsForTitle).mockResolvedValue({ trophyGroups: [] })
  const known: KnownSet = { languages: ['en-US'], groupLanguages: ['en-US'], known: [{ id: 0, type: 'platinum', groupId: 'default' }] }
  const snap = await fetchPsnGame('42', { ...GAME, hasDlc: true, pctWon: 80, earned: { bronze: 0, silver: 0, gold: 0, platinum: 1 } }, known, 'en-US')
  expect(snap.completedAt).toBe('2025-05-01T10:00:00Z')
  expect(psn.getTitleTrophies).not.toHaveBeenCalled()
})

describe('when Sony says too many requests', () => {
  afterEach(() => forgetPsnTokens())

  const tooMany = { error: { code: 1, message: 'Too many requests' } }
  const waitOut = () => jest.advanceTimersByTimeAsync(2_000)

  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('it waits and asks once more, and the second answer is used', async () => {
    // Anything after the refusal falls through to the suite's default answer.
    mock(psn.getUserTitles).mockResolvedValueOnce(tooMany as never)
    const pending = fetchPsnTitles('42')
    await waitOut()
    await expect(pending).resolves.toEqual([])
    expect(mock(psn.getUserTitles)).toHaveBeenCalledTimes(2)
  })

  test('each request is counted under its function (the retry and the sign-in too)', async () => {
    resetPsnCallStats()
    mock(psn.getUserTitles).mockResolvedValueOnce(tooMany as never)
    const pending = fetchPsnTitles('42')
    await waitOut()
    await pending
    expect(psnCallTotals()).toEqual({ auth: 2, titles: 2 })
  })

  test('a second refusal is thrown, and psnFailure answers 429 with a Retry-After', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mock(psn.getUserTitles).mockResolvedValue(tooMany as never)
    const pending = fetchPsnTitles('42').catch((e) => e)
    await waitOut()
    const err = await pending
    expect(err).toBeInstanceOf(PsnError)
    expect(err.isRateLimited).toBe(true)
    const res = psnFailure(err, 'test')
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
    ;(console.error as jest.Mock).mockRestore()
  })

  test('a hidden profile is not retried', async () => {
    mock(psn.getUserTrophyProfileSummary).mockResolvedValue({ error: { code: 2240526, message: 'Not permitted by access control' } } as never)
    await expect(fetchPsnSummary('42', null)).rejects.toMatchObject({ isPrivate: true })
    expect(mock(psn.getUserTrophyProfileSummary)).toHaveBeenCalledTimes(1)
  })

  test('only the wording of a rate limit counts as one', () => {
    expect(new PsnError('Too many requests').isRateLimited).toBe(true)
    expect(new PsnError('Rate limit exceeded').isRateLimited).toBe(true)
    expect(new PsnError('Internal').isRateLimited).toBe(false)
  })
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

const played = (titleId: string, lastPlayedDateTime: string, playDuration: string, images: { type: string; url: string }[] = [], imageUrl?: string) => ({
  titleId, name: titleId, lastPlayedDateTime, playDuration, playCount: 3, imageUrl, concept: { media: { images } },
})

test('play time, last session and store art come from the played-games list, matched by trophy set', async () => {
  mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [title('NPWR00001_00', '2026-01-01T00:00:00Z'), title('NPWR00002_00', '2026-03-01T00:00:00Z')] })
  mock(psn.getUserPlayedGames).mockResolvedValue({
    titles: [
      played('CUSA1', '2026-06-01T00:00:00Z', 'PT10H', [
        { type: 'PORTRAIT_BANNER', url: 'http://cover.png' },
        { type: 'BACKGROUND_LAYER_ART', url: 'https://hero.png' },
      ], 'http://square.png'),
    ],
  })
  mock(psn.getUserTrophiesForSpecificTitle).mockResolvedValue({
    titles: [{ npTitleId: 'CUSA1', trophyTitles: [{ npCommunicationId: 'NPWR00001_00' }] }],
  })
  const games = await psnLibrary('42')
  // The session moves the game above one with a newer trophy.
  expect(games.map((g) => g.titleId)).toEqual(['NPWR00001_00', 'NPWR00002_00'])
  expect(games[0]).toMatchObject({
    lastPlayed: '2026-06-01T00:00:00Z',
    lastTrophyAt: '2026-01-01T00:00:00Z',
    playtimeMinutes: 600,
    playCount: 3,
    playedAs: ['CUSA1'],
    imageIcon: 'https://square.png',
    coverUrl: 'https://cover.png',
    heroUrl: 'https://hero.png',
  })
  expect(games[1].playtimeMinutes).toBeNull()
  // A game's trophy sets are the same for every player: kept for everyone.
  expect(writeCache).toHaveBeenCalledWith('psn:sets:CUSA1', ['NPWR00001_00'], expect.any(Number))
})

test('a PS4 game has no portrait: its 16:9 hub art is the backdrop, not the cover, and MASTER the icon', async () => {
  mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [title('NPWR00001_00')] })
  mock(psn.getUserPlayedGames).mockResolvedValue({
    titles: [played('CUSA1', '2026-06-01T00:00:00Z', 'PT1H', [
      { type: 'GAMEHUB_COVER_ART', url: 'https://hub.jpg' },
      { type: 'MASTER', url: 'https://master.jpg' },
    ])],
  })
  mock(psn.getUserTrophiesForSpecificTitle).mockResolvedValue({
    titles: [{ npTitleId: 'CUSA1', trophyTitles: [{ npCommunicationId: 'NPWR00001_00' }] }],
  })
  const [game] = await psnLibrary('42')
  expect(game).toMatchObject({ coverUrl: null, heroUrl: 'https://hub.jpg', imageIcon: 'https://master.jpg' })
})

test('the trophy-set lookup goes five ids at a time, and skips what is cached', async () => {
  mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [] })
  mock(psn.getUserPlayedGames).mockResolvedValue({
    titles: Array.from({ length: 12 }, (_, i) => played(`CUSA${i}`, '2026-01-01T00:00:00Z', 'PT1H')),
  })
  mock(readCacheMany).mockResolvedValueOnce(new Map([['psn:sets:CUSA0', []]]))
  await psnLibrary('42')
  const batches = mock(psn.getUserTrophiesForSpecificTitle).mock.calls.map((c) => c[2].npTitleIds.split(',').length)
  expect(batches).toEqual([5, 5, 1])
})

test('a hidden played-games list leaves the trophies as they are', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [title('NPWR00001_00')] })
  mock(psn.getUserPlayedGames).mockResolvedValue({ error: { code: 2240526, message: 'Not permitted by access control' } })
  const games = await psnLibrary('42')
  expect(games).toHaveLength(1)
  expect(games[0].playtimeMinutes).toBeNull()
  // Anything else fails the pass (the worker keeps the stored list and logs it).
  mock(psn.getUserPlayedGames).mockResolvedValue({ error: { code: 500, message: 'Internal' } })
  await expect(psnLibrary('42')).rejects.toBeInstanceOf(PsnError)
  ;(console.error as jest.Mock).mockRestore()
})

test('a collection is one session for several games: only the one with the newest trophy takes it', () => {
  const base = psnGameFixture({ consoleName: 'PS4', playtimeMinutes: null, playedAs: [], playCount: null })
  const games = withPlayData(
    [
      { ...base, id: 1, titleId: 'NPWR11435_00', lastTrophyAt: '2025-04-02T00:00:00Z', lastPlayed: '2025-04-02T00:00:00Z' },
      { ...base, id: 2, titleId: 'NPWR11436_00', lastTrophyAt: '2026-10-06T00:00:00Z', lastPlayed: '2026-10-06T00:00:00Z' },
    ],
    [{ titleId: 'CUSA04893_00', name: 'Ezio Collection', lastPlayed: '2026-10-16T00:00:00Z', playtimeMinutes: 4543, playCount: 1, iconUrl: null, coverUrl: null, heroUrl: null, conceptId: null }],
    new Map([['CUSA04893_00', ['NPWR11436_00', 'NPWR11435_00']]]),
  )
  expect(games.map((g) => [g.id, g.lastPlayed])).toEqual([[2, '2026-10-16T00:00:00Z'], [1, '2025-04-02T00:00:00Z']])
  // Both know the collection they came through, with its own session and hours, for the feed's card.
  for (const g of games) expect(g.collection).toEqual({ titleId: 'CUSA04893_00', title: 'Ezio Collection', iconUrl: null, heroUrl: null, lastPlayed: '2026-10-16T00:00:00Z', playtimeMinutes: 4543 })
})

test('a collection puts its time on each of its trophy lists; two versions of one game add up', () => {
  const base = psnGameFixture({
    service: 'trophy', title: '', imageIcon: '', consoleName: 'PS4', maxPossible: 1, numAwarded: 0,
    pctWon: 0, lastPlayed: null, earned: { bronze: 0, silver: 0, gold: 0, platinum: 0 }, defined: { bronze: 1, silver: 0, gold: 0, platinum: 0 },
    lastTrophyAt: null, playtimeMinutes: null, playedAs: [], playCount: null, coverUrl: null, heroUrl: null,
  })
  const games = withPlayData(
    [{ ...base, id: 1, titleId: 'NPWR00000_01' }, { ...base, id: 2, titleId: 'NPWR00000_02' }, { ...base, id: 3, titleId: 'NPWR00000_03' }],
    [
      { titleId: 'COLL', name: 'COLL', lastPlayed: '2026-01-01T00:00:00Z', playtimeMinutes: 100, playCount: 1, iconUrl: 'coll', coverUrl: null, heroUrl: null, conceptId: null },
      { titleId: 'PS4V', name: 'PS4V', lastPlayed: '2026-01-01T00:00:00Z', playtimeMinutes: 30, playCount: 1, iconUrl: 'ps4', coverUrl: null, heroUrl: null, conceptId: null },
      { titleId: 'PS5V', name: 'PS5V', lastPlayed: '2026-02-01T00:00:00Z', playtimeMinutes: 20, playCount: 2, iconUrl: null, coverUrl: 'c', heroUrl: null, conceptId: null },
    ],
    new Map([['COLL', ['NPWR00000_01', 'NPWR00000_02']], ['PS4V', ['NPWR00000_03']], ['PS5V', ['NPWR00000_03']]]),
  )
  const byId = new Map(games.map((g) => [g.id, g]))
  // The collection's icon would make its games look alike: they keep their own.
  expect(byId.get(1)).toMatchObject({ playtimeMinutes: 100, playedAs: ['COLL'], imageIcon: '' })
  expect(byId.get(2)).toMatchObject({ playtimeMinutes: 100, playedAs: ['COLL'], imageIcon: '' })
  expect(byId.get(3)!.collection).toBeNull()
  expect(byId.get(3)).toMatchObject({ playtimeMinutes: 50, playCount: 3, lastPlayed: '2026-02-01T00:00:00Z', coverUrl: 'c', playedAs: ['PS4V', 'PS5V'], imageIcon: 'ps4' })
})

describe('sign-in', () => {
  beforeEach(() => forgetPsnTokens())

  test('reuses the tokens another instance stored, without spending the NPSSO', async () => {
    fakePsnStore.accounts[0].tokens = { accessToken: 'stored-access', accessExpiresAt: Date.now() + 3_600_000, refreshToken: 'r', refreshExpiresAt: Date.now() + 864_000_000 }
    mock(psn.makeUniversalSearch).mockResolvedValue(search())
    await findPsnAccount('abc')
    expect(psn.exchangeNpssoForAccessCode).not.toHaveBeenCalled()
    expect(mock(psn.makeUniversalSearch).mock.calls[0][0]).toEqual({ accessToken: 'stored-access' })
  })

  test("the account's NPSSO signs in when it has no tokens", async () => {
    fakePsnStore.reset([{ id: 1, npsso: 'from-admin' }])
    mock(psn.makeUniversalSearch).mockResolvedValue(search())
    await findPsnAccount('abc')
    expect(psn.exchangeNpssoForAccessCode).toHaveBeenLastCalledWith('from-admin')
    expect(fakePsnStore.accounts[0].tokens).toMatchObject({ accessToken: 'token' })
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
    mock(psn.getUserTrophiesEarnedForTitle).mockResolvedValue({ trophies: [] })
    mock(psn.getTitleTrophies).mockResolvedValue({ trophies: [] })
    const game = { ...GAME, titleId: 'NPWR07410_00', hasDlc: true }
    const snap = await fetchPsnGame('42', game, NOTHING_KNOWN, 'es-ES')
    expect(snap.groupDefs).toEqual([
      { id: 'default', name: 'Saints Row IV', iconUrl: 'https://g0.png', defined: { bronze: 10, silver: 2, gold: 1, platinum: 1 } },
      { id: '001', name: 'Enter the Dominatrix', iconUrl: null, defined: { bronze: 5, silver: 0, gold: 0, platinum: 0 } },
    ])
    expect(snap.groupsEarned).toEqual([
      { id: 'default', earned: { bronze: 10, silver: 2, gold: 1, platinum: 1 }, progress: 100 },
      { id: '001', earned: { bronze: 0, silver: 0, gold: 0, platinum: 0 }, progress: 0 },
    ])
    expect(mock(psn.getTitleTrophyGroups).mock.calls[0][2]).toEqual({ npServiceName: 'trophy', headerOverrides: { 'Accept-Language': 'es-ES' } })
    // Stored in that language: only the account's groups are asked for.
    mock(psn.getTitleTrophyGroups).mockClear()
    await fetchPsnGame('42', game, { ...NOTHING_KNOWN, groupLanguages: ['es-ES'] }, 'es-ES')
    expect(psn.getTitleTrophyGroups).not.toHaveBeenCalled()
  })

  test('a game with DLC counts by its whole set: with DLC trophies still to earn it is not complete, platinum or not', async () => {
    mock(psn.getUserTitles).mockResolvedValue({
      trophyTitles: [{ ...title('NPWR07410_00'), hasTrophyGroups: true, progress: 80, earnedTrophies: { bronze: 10, silver: 2, gold: 1, platinum: 1 }, definedTrophies: { bronze: 15, silver: 2, gold: 1, platinum: 1 } }],
    })
    const [game] = await psnLibrary('42')
    expect(game).toMatchObject({ hasDlc: true, pctWon: 80, numAwarded: 14, maxPossible: 19 })
    expect(game.earned).toEqual({ bronze: 10, silver: 2, gold: 1, platinum: 1 })
    expect(game.defined).toEqual({ bronze: 15, silver: 2, gold: 1, platinum: 1 })
  })

  test('the groups of a game are not asked for to list it: one call less per game with DLC', async () => {
    mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [{ ...title('NPWR07410_00'), hasTrophyGroups: true, progress: 80 }] })
    await psnLibrary('42')
    expect(mock(psn.getTitleTrophyGroups)).not.toHaveBeenCalled()
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
  const games = await psnLibrary('42')
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

describe('the budget for Sony', () => {
  const { reserveAttempt } = jest.requireMock('@/lib/attemptLimit') as { reserveAttempt: jest.Mock }
  const release = jest.fn()

  beforeEach(() => {
    jest.useRealTimers()
    release.mockClear()
    reserveAttempt.mockReset()
    reserveAttempt.mockResolvedValue({ allowed: true, release })
  })

  test('a call past the budget is refused without reaching Sony, as a rate limit', async () => {
    reserveAttempt.mockResolvedValue({ allowed: false, release })
    const call = jest.fn()
    const failure = (await psnCall('summary', call).catch((err: unknown) => err)) as PsnError
    expect(failure.isRateLimited).toBe(true)
    expect(call).not.toHaveBeenCalled()
    expect(release).toHaveBeenCalled()
  })

  test('a call Sony never answers ends at the deadline', async () => {
    jest.useFakeTimers()
    const pending = psnCall('summary', () => new Promise(() => {})).catch((err: unknown) => err as PsnError)
    await jest.advanceTimersByTimeAsync(8_000)
    expect(((await pending) as PsnError).message).toContain('did not answer')
    jest.useRealTimers()
  })
})

describe('phase 2 (#177)', () => {
  test("Sony's own 429 body is read as a rate limit by its code", () => {
    expect(new PsnError('Whatever', 2138635).isRateLimited).toBe(true)
  })

  test('the app budget spent is a PsnBusyError, answered 429 busy; a year being built is a 202', () => {
    const busy = psnFailure(new PsnBusyError(), 'test')
    expect(busy.status).toBe(429)
    expect((busy as unknown as { data: unknown }).data).toEqual({ error: 'busy' })
    const syncing = psnFailure(new PsnSyncing(), 'test')
    expect(syncing.status).toBe(202)
    expect(syncing.headers.get('Retry-After')).toBe('15')
  })

  test('an online ID nobody has is remembered for an hour, and not asked again', async () => {
    mock(psn.makeUniversalSearch).mockResolvedValue(search('someone_else'))
    expect(await findPsnAccount('Nobody')).toBeNull()
    expect(writeCache).toHaveBeenCalledWith('psn:notfound:nobody', true, 60 * 60 * 1000)
    mock(readCache).mockResolvedValueOnce(true)
    mock(psn.makeUniversalSearch).mockClear()
    expect(await findPsnAccount('NOBODY')).toBeNull()
    expect(mock(psn.makeUniversalSearch)).not.toHaveBeenCalled()
  })

  test('the library is the core alone while no enrichment is stored, never an error', async () => {
    mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [title('NPWR00001_00')] })
    const games = withEnrichment(await fetchPsnTitles('42'), null)
    expect(games.map((g) => g.titleId)).toEqual(['NPWR00001_00'])
    expect(mock(psn.getUserPlayedGames)).not.toHaveBeenCalled()
  })

  test('an enrichment pass looks up the trophy sets of 20 games at most, most recently played first', async () => {
    mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [] })
    mock(psn.getUserPlayedGames).mockResolvedValue({
      titles: Array.from({ length: 30 }, (_, i) => played(`CUSA${i}`, `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`, 'PT1H')),
    })
    await psnLibrary('42')
    const asked = mock(psn.getUserTrophiesForSpecificTitle).mock.calls.flatMap((c) => c[2].npTitleIds.split(','))
    expect(asked).toHaveLength(20)
    expect(asked[0]).toBe('CUSA29')
  })

  test('the played-games list goes through the budget like any other call', async () => {
    const { reserveAttempt } = jest.requireMock('@/lib/attemptLimit') as { reserveAttempt: jest.Mock }
    reserveAttempt.mockClear()
    resetPsnCallStats()
    mock(psn.getUserTitles).mockResolvedValue({ trophyTitles: [] })
    await psnLibrary('42')
    const totals = psnCallTotals()
    expect(totals.played).toBe(1)
    // Every request counted took its share of the budget first.
    expect(reserveAttempt).toHaveBeenCalledTimes(Object.values(totals).reduce((a, b) => a + b, 0))
  })
})
