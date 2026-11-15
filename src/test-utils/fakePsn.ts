/**
 * A fake Sony behind `psn-api`: a deterministic library of N games and the
 * answers each endpoint gives for it, with the same paging limits the real one
 * has (800 titles, 200 played games, 5 ids per trophy-set lookup). It counts
 * the requests it receives, so a test can check psnClient's own counters
 * against it. Never reaches the network.
 */
export type FakeGame = {
  i: number
  /** The trophy set: "NPWR10000_00". */
  titleId: string
  /** The played-games id ("CUSA10000_00"), or null for a PS3/Vita game, which has none. */
  playedId: string | null
  platform: 'PS5' | 'PS4' | 'PS3'
  /** Trophies earned, of 3 defined. 0 for a game launched and never earned from. */
  earned: number
  hasDlc: boolean
  platinum: boolean
  /** The last trophy, ISO; null when none was earned. */
  lastTrophyAt: string | null
}

export const FAKE_NOW = Date.UTC(2026, 10, 14, 12, 0, 0)
const DAY_MS = 24 * 60 * 60 * 1000
/** Requests the fake received, by `psn-api` function. */
export type FakeHits = Record<string, number>

/** A repeatable pseudo-random share in [0, 1) for game `i`; `k` is odd and not a multiple of 5, so it visits every residue. */
const share = (i: number, k: number) => ((i * k) % 100) / 100

/**
 * The model behind the numbers (documented in docs/platforms/psn.md): 70 % of
 * the games are PS4/PS5 with a played-games entry, 85 % have a trophy earned,
 * 15 % of those are at 100 %, 20 % have DLC, 20 % of the rest have the
 * platinum; 10 % of the library had its last trophy in the last 60 days and
 * 25 % in the last year.
 */
export function fakeLibrary(count: number): FakeGame[] {
  return Array.from({ length: count }, (_, i) => {
    const started = share(i, 53) < 0.85
    const age = share(i, 61)
    const daysAgo = age < 0.1 ? (age / 0.1) * 55 : age < 0.25 ? 70 + ((age - 0.1) / 0.15) * 280 : 400 + age * 1000
    const modern = share(i, 37) < 0.7
    return {
      i,
      titleId: `NPWR${10000 + i}_00`,
      playedId: modern ? `CUSA${10000 + i}_00` : null,
      platform: modern ? (i % 2 ? 'PS5' : 'PS4') : 'PS3',
      earned: started ? (share(i, 71) < 0.15 ? 3 : 1 + (i % 2)) : 0,
      hasDlc: share(i, 89) < 0.2,
      platinum: started && share(i, 43) < 0.2,
      lastTrophyAt: started ? new Date(FAKE_NOW - daysAgo * DAY_MS).toISOString() : null,
    }
  })
}

const NONE = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
const DEFINED = { ...NONE, bronze: 2, platinum: 1 }
/** 1 when the game's platinum is among what was earned. */
const plat = (g: FakeGame) => (g.platinum && g.earned > 0 ? 1 : 0)

function paged<T>(all: T[], offset: number, limit: number) {
  return { items: all.slice(offset, offset + limit), nextOffset: offset + limit < all.length ? offset + limit : undefined }
}

/** A trophy title as `getUserTitles` lists it. */
function trophyTitle(g: FakeGame) {
  return {
    npCommunicationId: g.titleId,
    npServiceName: g.platform === 'PS5' ? 'trophy2' : 'trophy',
    trophyTitleName: `Game ${g.i}`,
    trophyTitleIconUrl: 'https://img.example/icon.png',
    trophyTitlePlatform: g.platform,
    definedTrophies: DEFINED,
    earnedTrophies: { ...NONE, bronze: g.earned - plat(g), platinum: plat(g) },
    progress: Math.round((g.earned / 3) * 100),
    lastUpdatedDateTime: g.lastTrophyAt ?? undefined,
    hasTrophyGroups: g.hasDlc,
  }
}

/** A game's three base trophies, with what the account earned when `earned` is set. */
function trophiesOf(g: FakeGame, earned: boolean) {
  return [0, 1, 2].map((trophyId) => ({
    trophyId,
    trophyName: `Trophy ${trophyId}`,
    trophyType: g.platinum && trophyId === 0 ? 'platinum' : 'bronze',
    trophyGroupId: 'default',
    trophyHidden: false,
    ...(earned ? { earned: trophyId < g.earned, earnedDateTime: g.lastTrophyAt, trophyEarnedRate: '12.5' } : {}),
  }))
}

type Page = { limit: number; offset?: number }
type Mocked = Record<string, jest.Mock>

/** Makes each `psn-api` function (already a jest.fn from the test's mock) answer from `library`. Returns the request counters. */
export function installFakePsn(psnApi: unknown, library: FakeGame[]): FakeHits {
  const api = psnApi as Mocked
  const hits: FakeHits = {}
  const byTitle = new Map(library.map((g) => [g.titleId, g]))
  const played = library.filter((g) => g.playedId)
  const answer = (name: string, make: (...args: never[]) => unknown) =>
    api[name].mockImplementation(async (...args: unknown[]) => {
      hits[name] = (hits[name] ?? 0) + 1
      return make(...(args as never[]))
    })

  const tokens = { accessToken: 'token', refreshToken: 'refresh', expiresIn: 3600, refreshTokenExpiresIn: 86400 }
  answer('exchangeNpssoForAccessCode', () => 'code')
  answer('exchangeAccessCodeForAuthTokens', () => tokens)
  answer('exchangeRefreshTokenForAuthTokens', () => tokens)
  answer('makeUniversalSearch', (_a, name: string) => ({ domainResponses: [{ results: [{ socialMetadata: { onlineId: name, accountId: 'acc-1' } }] }] }))
  answer('getUserTrophyProfileSummary', () => ({ trophyLevel: '300', tier: 5, progress: 10, earnedTrophies: NONE }))
  answer('getProfileFromAccountId', () => ({ onlineId: 'player', avatars: [], aboutMe: '', isPlus: false }))
  answer('getUserTitles', (_a, _id, { limit, offset = 0 }: Page) => {
    const { items, nextOffset } = paged(library, offset, limit)
    return { trophyTitles: items.map(trophyTitle), totalItemCount: library.length, nextOffset }
  })
  answer('getUserPlayedGames', (_a, _id, { limit, offset = 0 }: Page) => {
    const { items, nextOffset } = paged(played, offset, limit)
    const titles = items.map((g) => ({
      titleId: g.playedId,
      name: `Game ${g.i}`,
      localizedName: `Game ${g.i}`,
      lastPlayedDateTime: g.lastTrophyAt,
      playDuration: 'PT10H',
      playCount: 3,
      imageUrl: 'https://img.example/store.png',
      concept: { id: g.i, media: { images: [] } },
    }))
    return { titles, nextOffset }
  })
  answer('getUserTrophiesForSpecificTitle', (_a, _id, { npTitleIds }: { npTitleIds: string }) => {
    const ids = npTitleIds.split(',')
    if (ids.length > 5) return { error: { message: 'too many ids', code: 1 } }
    const owner = (id: string) => played.find((g) => g.playedId === id)
    return { titles: ids.map((npTitleId) => ({ npTitleId, trophyTitles: owner(npTitleId) ? [{ npCommunicationId: owner(npTitleId)!.titleId }] : [] })) }
  })
  answer('getTitleTrophies', (_a, titleId: string) => ({ trophies: trophiesOf(byTitle.get(titleId)!, false) }))
  answer('getUserTrophiesEarnedForTitle', (_a, _id, titleId: string) => ({ trophies: trophiesOf(byTitle.get(titleId)!, true) }))
  answer('getTitleTrophyGroups', () => ({ trophyGroups: [{ trophyGroupId: 'default', trophyGroupName: 'Base game', definedTrophies: DEFINED }] }))
  answer('getUserTrophyGroupEarningsForTitle', () => ({ trophyGroups: [{ trophyGroupId: 'default', earnedTrophies: NONE, progress: 0 }] }))
  return hits
}
