jest.mock('@/lib/steamCache', () => ({
  withSteamCache: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>, options?: { shouldCache?: (d: unknown) => boolean }) =>
    fetcher().then((data) => {
      options?.shouldCache?.(data)
      return data
    }),
  ),
}))

import {
  findXboxAccount,
  findXboxGame,
  isGamertag,
  isTitleId,
  isXuid,
  xboxCall,
  xboxConfigured,
  xboxFailure,
  XboxError,
  xboxGameAchievements,
  xboxLanguage,
  xboxLatestAchievements,
  xboxLibrary,
  xboxLibraryData,
  xboxRateLimit,
  xboxRecentAchievements,
  xboxSummary,
} from './xboxClient'
import { withSteamCache } from '@/lib/steamCache'
import { RAW_360_ACHIEVEMENT, RAW_360_TITLE, RAW_ACHIEVED, RAW_LOCKED, RAW_MODERN_TITLE, RAW_PROFILE, xboxGameFixture } from '@/test-utils/xboxFixtures'

const fetchMock = jest.fn()
const XUID = '2535400000000001'

/** What OpenXBL answers: an HTTP status, the rate-limit headers and a body that carries its own code. */
function answer(content: unknown, { status = 200, code = 200, remaining = '147' }: { status?: number; code?: number; remaining?: string | null } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name === 'x-ratelimit-remaining' ? remaining : name === 'x-ratelimit-limit' ? '150' : null) },
    json: async () => ({ content, code }),
  }
}

/** Routes each call by its path, so a test can say what several different calls answer. */
function routes(map: Record<string, unknown>) {
  fetchMock.mockImplementation(async (url: string) => {
    const path = url.replace('https://api.xbl.io/v2/', '')
    const hit = Object.entries(map).find(([key]) => path.startsWith(key))
    if (!hit) throw new Error(`unexpected call: ${path}`)
    if (hit[1] instanceof Error) throw hit[1]
    return hit[1]
  })
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const title = (id: string, overrides: Record<string, unknown> = {}) => ({
  ...RAW_MODERN_TITLE,
  titleId: id,
  name: `Game ${id}`,
  titleHistory: { lastTimePlayed: daysAgo(1) },
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = fetchMock
  fetchMock.mockReset()
  process.env.OPENXBL_API_KEY = 'key-for-tests'
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  ;(console.error as jest.Mock).mockRestore()
  delete process.env.OPENXBL_API_KEY
})

describe('input checks', () => {
  test('gamertags: letters, digits and spaces, up to 15, with an optional #suffix', () => {
    for (const ok of ['PalmeraMiami', 'Two Words', 'Name#1234', 'a']) expect(isGamertag(ok)).toBe(true)
    for (const bad of ['', 'x'.repeat(16), 'a/b', '../etc', 'a?b=1', 'name#', 42, null]) expect(isGamertag(bad)).toBe(false)
  })

  test('xuids and title ids are digits only, so nothing else can reach a URL path', () => {
    expect(isXuid(XUID)).toBe(true)
    expect(isXuid('12/../x')).toBe(false)
    expect(isXuid('123')).toBe(false)
    expect(isTitleId('1738914043')).toBe(true)
    expect(isTitleId('12345678901')).toBe(false)
    expect(isTitleId('1a')).toBe(false)
    expect(isTitleId(5)).toBe(false)
  })

  test('the app language picks the language texts come in, and an unknown one gets English', () => {
    expect(xboxLanguage('es')).toBe('es-ES')
    expect(xboxLanguage('ja')).toBe('ja-JP')
    expect(xboxLanguage('xx')).toBe('en-US')
    expect(xboxLanguage(null)).toBe('en-US')
  })
})

describe('xboxConfigured', () => {
  test('follows the key', () => {
    expect(xboxConfigured()).toBe(true)
    process.env.OPENXBL_API_KEY = '  '
    expect(xboxConfigured()).toBe(false)
  })
})

describe('xboxCall', () => {
  test('sends the key and an explicit language (OpenXBL refuses "*"), and returns the content', async () => {
    fetchMock.mockResolvedValue(answer({ hello: 1 }))
    expect(await xboxCall('account')).toEqual({ hello: 1 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.xbl.io/v2/account')
    expect(init.headers).toMatchObject({ 'X-Authorization': 'key-for-tests', 'Accept-Language': 'en-US' })
  })

  test('a call can ask for another language', async () => {
    fetchMock.mockResolvedValue(answer({}))
    await xboxCall('x', { language: 'es-ES' })
    expect(fetchMock.mock.calls[0][1].headers['Accept-Language']).toBe('es-ES')
  })

  test('remembers the calls left this hour', async () => {
    fetchMock.mockResolvedValue(answer({}, { remaining: '41' }))
    await xboxCall('account')
    expect(xboxRateLimit()).toEqual({ remaining: 41, limit: 150 })
  })

  test('a POST sends its body as JSON', async () => {
    fetchMock.mockResolvedValue(answer({}))
    await xboxCall('player/stats', { method: 'POST', body: { a: 1 } })
    const [, init] = fetchMock.mock.calls[0]
    expect(init).toMatchObject({ method: 'POST', body: '{"a":1}' })
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  test('no key: not-configured, and OpenXBL is never asked', async () => {
    delete process.env.OPENXBL_API_KEY
    await expect(xboxCall('account')).rejects.toMatchObject({ kind: 'not-configured' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test.each([
    [401, 'unauthorized'],
    [403, 'private'],
    [404, 'not-found'],
    [429, 'rate-limited'],
    [500, 'failed'],
  ])('HTTP %i is %s', async (status, kind) => {
    fetchMock.mockResolvedValue(answer(null, { status, code: status }))
    await expect(xboxCall('x')).rejects.toMatchObject({ kind })
  })

  test('an error inside a 200 answer is still an error (OpenXBL reports them that way)', async () => {
    fetchMock.mockResolvedValue(answer('Request contains Accept-Language header with invalid locale value: *', { code: 400 }))
    await expect(xboxCall('titles/1')).rejects.toMatchObject({ kind: 'failed' })
    fetchMock.mockResolvedValue(answer(null, { code: 429 }))
    await expect(xboxCall('titles/1')).rejects.toMatchObject({ kind: 'rate-limited' })
  })

  test('a network failure and a non-JSON answer are failures, not crashes', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    await expect(xboxCall('x')).rejects.toMatchObject({ kind: 'failed' })
    fetchMock.mockResolvedValue({ ok: true, status: 200, headers: { get: () => null }, json: async () => { throw new Error('html') } })
    await expect(xboxCall('x')).rejects.toMatchObject({ kind: 'failed' })
  })
})

describe('findXboxAccount', () => {
  test('one search gives the profile, with the gamertag encoded into the URL', async () => {
    fetchMock.mockResolvedValue(answer({ profileUsers: [RAW_PROFILE] }))
    expect(await findXboxAccount(' Name#1234 ')).toMatchObject({ xuid: XUID, gamertag: 'TestPlayer' })
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.xbl.io/v2/friends/search?gt=Name%231234')
    expect(withSteamCache).toHaveBeenCalledWith('xbox:account:v2:name#1234', expect.any(Number), expect.any(Function), expect.any(Object))
  })

  test('no such account is null, and is not cached', async () => {
    fetchMock.mockResolvedValue(answer({ profileUsers: [] }))
    expect(await findXboxAccount('nobody')).toBeNull()
    const { shouldCache } = (withSteamCache as jest.Mock).mock.calls[0][3]
    expect(shouldCache(null)).toBe(false)
    expect(shouldCache({ xuid: '1' })).toBe(true)
  })
})

describe('the library', () => {
  const library = answer({
    titles: [RAW_360_TITLE, RAW_MODERN_TITLE, { ...RAW_MODERN_TITLE, titleId: 'bad' }],
    achievementSummary: { totalAchievementsUnlocked: 593 },
  })

  test('every game, most recently played first, with what the whole library unlocked; a game it cannot key is left out', async () => {
    fetchMock.mockResolvedValue(library)
    const data = await xboxLibraryData(XUID)
    expect(data.achievementsUnlocked).toBe(593)
    expect(data.games.map((g) => g.title)).toEqual(['Modern Game', 'Old Game'])
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.xbl.io/v2/titles/${XUID}`)
  })

  test('an account with no titles is an empty library', async () => {
    fetchMock.mockResolvedValue(answer({}))
    expect(await xboxLibrary(XUID)).toEqual([])
    expect((await xboxLibraryData(XUID)).achievementsUnlocked).toBe(0)
  })

  test('the refresh button may replace it, and it is kept for the user', async () => {
    fetchMock.mockResolvedValue(answer({ titles: [] }))
    await xboxLibraryData(XUID, '7')
    expect((withSteamCache as jest.Mock).mock.calls[0][3]).toEqual({ userId: '7', refreshable: true })
  })

  test('a game is found by its title id, or is null', async () => {
    fetchMock.mockResolvedValue(library)
    expect((await findXboxGame(XUID, '1096157159'))?.title).toBe('Old Game')
    expect(await findXboxGame(XUID, '999')).toBeNull()
  })
})

describe('xboxSummary', () => {
  test('the profile and the library, joined: gamerscore, achievements unlocked and games', async () => {
    routes({
      'friends/search': answer({ profileUsers: [RAW_PROFILE] }),
      titles: answer({ titles: [RAW_MODERN_TITLE, RAW_360_TITLE], achievementSummary: { totalAchievementsUnlocked: 593 } }),
    })
    expect(await xboxSummary(XUID, 'TestPlayer', '7')).toEqual({
      gamertag: 'TestPlayer',
      avatarUrl: 'https://images-eds-ssl.xboxlive.com/image?url=abc&format=png',
      bio: 'Plays everything',
      tier: 'Silver',
      gamerscore: 10242,
      achievementsUnlocked: 593,
      games: 2,
    })
  })

  test('a gamertag that now belongs to someone else is not-found, not the wrong person', async () => {
    routes({ 'friends/search': answer({ profileUsers: [{ ...RAW_PROFILE, id: '999' }] }) })
    await expect(xboxSummary(XUID, 'TestPlayer')).rejects.toMatchObject({ kind: 'not-found' })
  })

  test('no account under that gamertag is not-found, and the library is never asked', async () => {
    routes({ 'friends/search': answer({ profileUsers: [] }) })
    await expect(xboxSummary(XUID, 'Gone')).rejects.toMatchObject({ kind: 'not-found' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('xboxGameAchievements', () => {
  test('a modern game uses the player endpoint, in the language asked', async () => {
    fetchMock.mockResolvedValue(answer({ achievements: [RAW_ACHIEVED, RAW_LOCKED] }))
    const list = await xboxGameAchievements(XUID, { titleId: '1738914043', is360: false, lastPlayed: '2026-10-01T00:00:00Z' }, '7', 'es-ES')
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ name: 'Prologue', gamerscore: 10, unlocked: true })
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.xbl.io/v2/achievements/player/${XUID}/1738914043`)
    expect(fetchMock.mock.calls[0][1].headers['Accept-Language']).toBe('es-ES')
  })

  test('an Xbox 360 game uses its own endpoint and shape', async () => {
    fetchMock.mockResolvedValue(answer({ achievements: [RAW_360_ACHIEVEMENT] }))
    const list = await xboxGameAchievements(XUID, { titleId: '1096157159', is360: true, lastPlayed: null })
    expect(list[0]).toMatchObject({ id: '49', gamerscore: 30, unlocked: true })
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.xbl.io/v2/achievements/x360/${XUID}/title/1096157159`)
  })

  test('the cache key changes with the last session and the language, so a played game is asked again', async () => {
    fetchMock.mockResolvedValue(answer({ achievements: [] }))
    const base = { titleId: '5', is360: false }
    await xboxGameAchievements(XUID, { ...base, lastPlayed: 'A' })
    await xboxGameAchievements(XUID, { ...base, lastPlayed: 'B' })
    await xboxGameAchievements(XUID, { ...base, lastPlayed: 'A' }, null, 'es-ES')
    const keys = (withSteamCache as jest.Mock).mock.calls.map((c) => c[0])
    expect(new Set(keys).size).toBe(3)
    expect(keys[0]).toBe(`xbox:achievements:v2:${XUID}:5:A:en-US`)
  })

  test('a game with none is an empty list', async () => {
    fetchMock.mockResolvedValue(answer({}))
    expect(await xboxGameAchievements(XUID, { titleId: '5', is360: false, lastPlayed: null })).toEqual([])
  })
})

describe('the feeds', () => {
  const earned = (id: string, when: string, extra: Record<string, unknown> = {}) => ({
    ...RAW_ACHIEVED,
    id,
    name: `Achievement ${id}`,
    progression: { timeUnlocked: when },
    ...extra,
  })

  test('the latest: from the last few games played with something earned, newest first, whatever their age', async () => {
    routes({
      titles: answer({
        titles: [
          title('1', { titleHistory: { lastTimePlayed: daysAgo(1) } }),
          title('2', { titleHistory: { lastTimePlayed: daysAgo(2) } }),
          // Never earned anything: nothing to look through.
          title('3', { titleHistory: { lastTimePlayed: daysAgo(3) }, achievement: { currentAchievements: 0, currentGamerscore: 0, totalGamerscore: 100 } }),
          title('4', { titleHistory: { lastTimePlayed: daysAgo(4) } }),
          title('5', { titleHistory: { lastTimePlayed: daysAgo(5) } }),
        ],
      }),
      'achievements/player': answer({ achievements: [earned('a', daysAgo(400)), earned('b', daysAgo(2)), RAW_LOCKED] }),
    })
    const list = await xboxLatestAchievements(XUID)
    // 1, 2 and 4 are the three latest games with something earned: one list each.
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('achievements/player'))).toHaveLength(3)
    expect(list).toHaveLength(6)
    expect(list[0].earnedAt >= list[5].earnedAt).toBe(true)
    expect(list[0]).toMatchObject({ gameTitle: expect.stringMatching(/^Game /), name: expect.any(String), gamerscore: 10 })
  })

  test('a window keeps only what was earned inside it, in games played inside it', async () => {
    routes({
      titles: answer({
        titles: [title('1', { titleHistory: { lastTimePlayed: daysAgo(3) } }), title('2', { titleHistory: { lastTimePlayed: daysAgo(100) } })],
      }),
      'achievements/player': answer({ achievements: [earned('new', daysAgo(2)), earned('old', daysAgo(200))] }),
    })
    const list = await xboxRecentAchievements(XUID, 'activity', 60)
    expect(list.map((a) => a.achievementId)).toEqual(['new'])
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('achievements/player'))).toHaveLength(1)
  })

  test('a window scans at most so many games, the most recent ones', async () => {
    const titles = Array.from({ length: 30 }, (_, i) => title(String(100 + i), { titleHistory: { lastTimePlayed: daysAgo(1 + i / 100) } }))
    routes({ titles: answer({ titles }), 'achievements/player': answer({ achievements: [] }) })
    await xboxRecentAchievements(XUID, 'activity', 60)
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('achievements/player'))).toHaveLength(20)
  })

  test('one game failing leaves it out; the rest still count', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/titles/')) return answer({ titles: [title('1'), title('2')] })
      if (url.endsWith('/1')) throw new Error('boom')
      return answer({ achievements: [earned('x', daysAgo(1))] })
    })
    const list = await xboxRecentAchievements(XUID, 'activity', 60)
    expect(list).toHaveLength(1)
    expect(list[0].titleId).toBe('2')
  })

  test('every game failing is a failure, not an empty feed', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/titles/')) return answer({ titles: [title('1'), title('2')] })
      return answer(null, { status: 429, code: 429 })
    })
    await expect(xboxRecentAchievements(XUID, 'activity', 60)).rejects.toMatchObject({ kind: 'rate-limited' })
  })

  test('no game in the window is an empty feed with no calls for achievements', async () => {
    routes({ titles: answer({ titles: [title('1', { titleHistory: { lastTimePlayed: daysAgo(300) } })] }) })
    expect(await xboxRecentAchievements(XUID, 'activity', 60)).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('an achievement earned with no date is left out', async () => {
    routes({
      titles: answer({ titles: [title('1')] }),
      'achievements/player': answer({ achievements: [{ ...RAW_ACHIEVED, progression: { timeUnlocked: '0001-01-01T00:00:00Z' } }] }),
    })
    expect(await xboxRecentAchievements(XUID, 'year', 366)).toEqual([])
  })
})

describe('xboxFailure', () => {
  const body = (res: unknown) => (res as { data: unknown }).data
  const status = (res: unknown) => (res as { status: number }).status

  test.each([
    ['not-configured', 503, 'not-configured'],
    ['unauthorized', 503, 'unauthorized'],
    ['private', 403, 'private'],
    ['not-found', 404, 'not-found'],
    ['rate-limited', 429, 'rate-limited'],
    ['failed', 502, 'failed'],
  ] as const)('%s becomes %i', (kind, code, error) => {
    const res = xboxFailure(new XboxError(kind, 'x'), 'test')
    expect(status(res)).toBe(code)
    expect(body(res)).toEqual({ error })
  })

  test('anything else is a 502, and is logged', () => {
    const res = xboxFailure(new Error('boom'), 'test')
    expect(status(res)).toBe(502)
    expect(console.error).toHaveBeenCalled()
  })

  test("a refused key is logged for the admin to see, since it is not the caller's doing", () => {
    xboxFailure(new XboxError('unauthorized', 'refused'), 'test')
    expect(console.error).toHaveBeenCalled()
  })

  test('a limited call tells the client when to come back', () => {
    const res = xboxFailure(new XboxError('rate-limited', 'x'), 'test') as unknown as { headers?: Record<string, string> }
    expect(res.headers?.['Retry-After'] ?? '60').toBe('60')
  })
})

test('a game fixture is a complete XboxGameProgress', () => {
  expect(xboxGameFixture()._source).toBe('xbox')
})
