jest.mock('@/lib/steamCache', () => ({
  withSteamCache: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>, options?: { shouldCache?: (d: unknown) => boolean }) =>
    fetcher().then((data) => {
      options?.shouldCache?.(data)
      return data
    }),
  ),
}))
jest.mock('@/lib/attemptLimit', () => ({ allowAttempt: jest.fn(async () => true) }))

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
  resetXboxCallState,
} from './xboxClient'
import { withSteamCache } from '@/lib/steamCache'
import { allowAttempt } from '@/lib/attemptLimit'
import { recordXboxCacheEvent, withXboxTelemetry } from '@/lib/xboxTelemetry'
import { NextResponse } from 'next/server'
import { RAW_360_ACHIEVEMENT, RAW_360_TITLE, RAW_ACHIEVED, RAW_LOCKED, RAW_MODERN_TITLE, RAW_PROFILE, xboxGameFixture } from '@/test-utils/xboxFixtures'

const fetchMock = jest.fn()
const XUID = '2535400000000001'

/** What OpenXBL answers: an HTTP status, the rate-limit headers and a body that carries its own code. */
function answer(content: unknown, { status = 200, code = 200, remaining = '147', reset = null }: { status?: number; code?: number; remaining?: string | null; reset?: string | null } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => {
        if (name === 'x-ratelimit-remaining') return remaining
        if (name === 'x-ratelimit-limit') return '150'
        if (name === 'x-ratelimit-reset') return reset
        return null
      },
    },
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
  ;(withSteamCache as jest.Mock).mockImplementation((_key: string, _ttl: number, fetcher: () => Promise<unknown>, options?: { shouldCache?: (d: unknown) => boolean }) =>
    fetcher().then((data) => {
      options?.shouldCache?.(data)
      return data
    }),
  )
  global.fetch = fetchMock
  fetchMock.mockReset()
  process.env.OPENXBL_API_KEY = 'key-for-tests'
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  ;(console.error as jest.Mock).mockRestore()
  ;(console.info as jest.Mock).mockRestore()
  ;(console.warn as jest.Mock).mockRestore()
  delete process.env.OPENXBL_API_KEY
  jest.useRealTimers()
  resetXboxCallState()
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

  test('reports one sanitized upstream operation inside the request telemetry', async () => {
    fetchMock.mockResolvedValue(answer({ titles: [] }))
    const res = await withXboxTelemetry('xbox/test', async () => {
      await xboxCall(`titles/${XUID}`)
      return NextResponse.json({})
    })

    expect(res.headers.get('X-Xbox-Upstream-Calls')).toBe('1')
    const line = (console.info as jest.Mock).mock.calls.map(([value]) => String(value)).find((value) => value.includes('xbox_upstream'))
    expect(line).toContain('"operation":"library"')
    expect(line).not.toContain(XUID)
    expect(line).not.toContain('key-for-tests')
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

  test('a timeout is bounded and has its own retryable failure kind', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('timed out'), { name: 'TimeoutError' }))
    await expect(xboxCall('x')).rejects.toMatchObject({ kind: 'timeout' })
    expect(fetchMock.mock.calls[0][1].signal).toBeDefined()
  })

  test('a timeout while reading the response body is still a timeout', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => { throw Object.assign(new Error('body timed out'), { name: 'TimeoutError' }) },
    })
    await expect(xboxCall('titles/1')).rejects.toMatchObject({ kind: 'timeout' })
  })

  test('the app-wide attempt budget refuses an upstream call before fetch', async () => {
    ;(allowAttempt as jest.Mock).mockResolvedValueOnce(false)
    await expect(xboxCall('titles/1')).rejects.toMatchObject({ kind: 'rate-limited' })
    expect(allowAttempt).toHaveBeenCalledWith('xbox-upstream', 'app')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('a 429 pauses this instance until the reset window has passed', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-30T12:00:00Z'))
    fetchMock.mockResolvedValue(answer(null, { status: 429, code: 429 }))
    await expect(xboxCall('titles/1')).rejects.toMatchObject({ kind: 'rate-limited' })
    await expect(xboxCall('titles/1')).rejects.toMatchObject({ kind: 'rate-limited' })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(61_000)
    fetchMock.mockResolvedValue(answer({ titles: [] }))
    await expect(xboxCall('titles/1')).resolves.toEqual({ titles: [] })
    expect(fetchMock).toHaveBeenCalledTimes(2)
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

  test('a public account with no games is an empty library', async () => {
    fetchMock.mockResolvedValue(answer({ titles: [], achievementSummary: { totalAchievementsUnlocked: 0 } }))
    expect(await xboxLibrary(XUID)).toEqual([])
    expect((await xboxLibraryData(XUID)).achievementsUnlocked).toBe(0)
  })

  test('a library that answers like one that does not exist (no titles, no summary) is private', async () => {
    fetchMock.mockResolvedValue(answer({ xuid: XUID, titles: [] }))
    await expect(xboxLibraryData(XUID)).rejects.toMatchObject({ kind: 'private' })
    fetchMock.mockResolvedValue(answer({}))
    await expect(xboxLibraryData(XUID)).rejects.toMatchObject({ kind: 'private' })
  })

  test('the refresh button may replace it, and it is kept for the user', async () => {
    fetchMock.mockResolvedValue(answer({ titles: [], achievementSummary: {} }))
    await xboxLibraryData(XUID, '7')
    expect((withSteamCache as jest.Mock).mock.calls[0][3]).toMatchObject({ userId: '7', refreshable: true })
  })

  test.each([
    ['failed', true],
    ['timeout', true],
    ['rate-limited', true],
    ['private', false],
    ['not-found', false],
    ['not-configured', false],
    ['unauthorized', false],
  ] as const)('%s stale eligibility is %s', async (kind, expected) => {
    fetchMock.mockResolvedValue(answer({ titles: [], achievementSummary: {} }))
    await xboxLibraryData(XUID)
    const options = (withSteamCache as jest.Mock).mock.calls[0][3]
    expect(options.staleIfError(new XboxError(kind, 'x'))).toBe(expected)
  })

  describe('play time', () => {
    const retro = { ...RAW_360_TITLE, titleId: '1096157379', devices: ['Xbox360', 'XboxOne'], mediaItemType: 'Xbox360Game', modernTitleId: '1664492743' }
    const stat = (titleid: string, value: string | null) => ({ titleid, name: 'MinutesPlayed', value })
    const stats = (...list: unknown[]) => answer({ statlistscollection: [{ stats: list }] })

    test('comes from one stats call for the whole library, a retro game under its newer id', async () => {
      routes({
        titles: answer({ titles: [RAW_MODERN_TITLE, retro, RAW_360_TITLE] }),
        'player/stats': stats(stat('1738914043', '3409'), stat('1664492743', '66')),
      })
      const games = await xboxLibrary(XUID)
      expect(Object.fromEntries(games.map((g) => [g.titleId, g.playtimeMinutes]))).toEqual({ '1738914043': 3409, '1096157379': 66, '1096157159': null })
      const call = fetchMock.mock.calls.find((c) => String(c[0]).endsWith('player/stats'))!
      expect(call[1].method).toBe('POST')
      expect(JSON.parse(call[1].body)).toEqual({
        xuids: [XUID],
        stats: [{ name: 'MinutesPlayed', titleId: '1738914043' }, { name: 'MinutesPlayed', titleId: '1664492743' }],
      })
    })

    test('a value that is missing or zero is no play time', async () => {
      routes({ titles: answer({ titles: [RAW_MODERN_TITLE] }), 'player/stats': stats(stat('1738914043', null)) })
      expect((await xboxLibrary(XUID))[0].playtimeMinutes).toBeNull()
    })

    test('a stats call that fails leaves the library whole and marks its cached play time partial', async () => {
      routes({ titles: answer({ titles: [RAW_MODERN_TITLE] }), 'player/stats': new Error('boom') })
      const data = await xboxLibraryData(XUID)
      expect(data.games).toHaveLength(1)
      expect(data.games[0].playtimeMinutes).toBeNull()
      expect(data.playtimeComplete).toBe(false)
      expect(console.error).toHaveBeenCalledWith('[xbox] play time', expect.anything())
    })

    test('a big library is split over several calls', async () => {
      const many = Array.from({ length: 151 }, (_, i) => ({ ...RAW_MODERN_TITLE, titleId: String(1000 + i) }))
      routes({ titles: answer({ titles: many }), 'player/stats': stats() })
      await xboxLibrary(XUID)
      expect(fetchMock.mock.calls.filter((c) => String(c[0]).endsWith('player/stats'))).toHaveLength(2)
    })

    test('only the 300 most recently played games are asked for', async () => {
      const many = Array.from({ length: 320 }, (_, i) => ({ ...RAW_MODERN_TITLE, titleId: String(1000 + i), titleHistory: { lastTimePlayed: new Date(Date.UTC(2020, 0, 1 + i)).toISOString() } }))
      routes({ titles: answer({ titles: many, achievementSummary: {} }), 'player/stats': stats() })
      await xboxLibrary(XUID)
      const asked = fetchMock.mock.calls
        .filter((c) => String(c[0]).endsWith('player/stats'))
        .flatMap((c) => JSON.parse(c[1].body).stats.map((s: { titleId: string }) => s.titleId))
      expect(asked).toHaveLength(300)
      expect(asked).toContain('1319')
      expect(asked).not.toContain('1000')
    })

    test('a library with only 360 games that have no newer id asks for nothing', async () => {
      routes({ titles: answer({ titles: [RAW_360_TITLE] }) })
      await xboxLibrary(XUID)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  test('a cached partial library still carries its partial play-time marker', async () => {
    ;(withSteamCache as jest.Mock).mockImplementation(async (_key: string, _ttl: number, _fetcher: () => Promise<unknown>, options?: { onEvent?: (event: string) => void }) => {
      options?.onEvent?.('hit')
      return { games: [], achievementsUnlocked: 0, playtimeComplete: false }
    })
    const res = await withXboxTelemetry('xbox/test', async () => {
      await xboxLibraryData(XUID)
      return NextResponse.json({})
    })
    expect(res.headers.get('X-Xbox-Partial')).toBe('playtime')
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

  test('a stale nested account or library makes the summary stale instead of fresh cacheable data', async () => {
    let staleResult: boolean | undefined
    ;(withSteamCache as jest.Mock).mockImplementation(async (key: string, _ttl: number, fetcher: () => Promise<unknown>, options?: { staleResult?: () => boolean }) => {
      if (key.startsWith('xbox:account:')) recordXboxCacheEvent('stale')
      const data = await fetcher()
      if (key.startsWith('xbox:summary:')) staleResult = options?.staleResult?.()
      return data
    })
    routes({
      'friends/search': answer({ profileUsers: [RAW_PROFILE] }),
      titles: answer({ titles: [], achievementSummary: { totalAchievementsUnlocked: 0 } }),
    })

    await withXboxTelemetry('xbox/test', async () => {
      await xboxSummary(XUID, 'TestPlayer')
      return NextResponse.json({})
    })
    expect(staleResult).toBe(true)
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

  test('an Xbox 360 game joins the title list with what the account unlocked', async () => {
    const locked = { ...RAW_360_ACHIEVEMENT, id: 50, name: 'Locked one', unlocked: false, timeUnlocked: '2002-11-15T00:00:00Z' }
    const titleList = { ...RAW_360_ACHIEVEMENT, unlocked: false, timeUnlocked: '2002-11-15T00:00:00Z' }
    routes({
      [`achievements/player/${XUID}/title/1096157159`]: answer({ achievements: [titleList, locked] }),
      [`achievements/x360/${XUID}/title/1096157159`]: answer({ achievements: [RAW_360_ACHIEVEMENT] }),
    })
    const list = await xboxGameAchievements(XUID, { titleId: '1096157159', is360: true, lastPlayed: null })
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ id: '49', gamerscore: 30, unlocked: true, unlockedAt: RAW_360_ACHIEVEMENT.timeUnlocked })
    expect(list[1]).toMatchObject({ id: '50', unlocked: false, unlockedAt: null })
  })

  test('the cache key changes with the last session and the language, so a played game is asked again', async () => {
    fetchMock.mockResolvedValue(answer({ achievements: [] }))
    const base = { titleId: '5', is360: false }
    await xboxGameAchievements(XUID, { ...base, lastPlayed: 'A' })
    await xboxGameAchievements(XUID, { ...base, lastPlayed: 'B' })
    await xboxGameAchievements(XUID, { ...base, lastPlayed: 'A' }, null, 'es-ES')
    const keys = (withSteamCache as jest.Mock).mock.calls.map((c) => c[0])
    expect(new Set(keys).size).toBe(3)
    expect(keys[0]).toBe(`xbox:achievements:v5:${XUID}:5:A:en-US`)
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

  test('an assembled feed has a versioned scope, window, activity and language key', async () => {
    const lastPlayed = daysAgo(1)
    routes({
      titles: answer({ titles: [title('1', { titleHistory: { lastTimePlayed: lastPlayed } })] }),
      'achievements/player': answer({ achievements: [] }),
    })
    await xboxRecentAchievements(XUID, 'activity', 60, '7', 'es-ES')

    const keys = (withSteamCache as jest.Mock).mock.calls.map((call) => call[0])
    expect(keys).toContain(`xbox:feed:v2:${XUID}:activity:60:${lastPlayed}:es-ES`)
  })

  test('a warm assembled feed does not repeat its library or per-game scans', async () => {
    const cache = new Map<string, unknown>()
    ;(withSteamCache as jest.Mock).mockImplementation(async (key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
      if (cache.has(key)) return cache.get(key)
      const data = await fetcher()
      cache.set(key, data)
      return data
    })
    routes({
      titles: answer({ titles: [title('1')] }),
      'achievements/player': answer({ achievements: [earned('new', daysAgo(1))] }),
    })

    await xboxRecentAchievements(XUID, 'activity', 60)
    await xboxRecentAchievements(XUID, 'activity', 60)

    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/titles/'))).toHaveLength(1)
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('achievements/player'))).toHaveLength(1)
    const keys = (withSteamCache as jest.Mock).mock.calls.map((call) => call[0])
    expect(keys.filter((key: string) => key.startsWith('xbox:feed:'))).toHaveLength(2)
    expect(keys.filter((key: string) => key.startsWith('xbox:achievements:'))).toHaveLength(1)
  })

  test('a moved latest session selects a new assembled feed key', async () => {
    routes({ titles: answer({ titles: [title('1')] }), 'achievements/player': answer({ achievements: [] }) })
    await xboxRecentAchievements(XUID, 'year', 366)
    const firstKey = (withSteamCache as jest.Mock).mock.calls.map((call) => call[0]).find((key: string) => key.startsWith('xbox:feed:'))

    const moved = daysAgo(0)
    routes({ titles: answer({ titles: [title('1', { titleHistory: { lastTimePlayed: moved } })] }), 'achievements/player': answer({ achievements: [] }) })
    await xboxRecentAchievements(XUID, 'year', 366)
    const keys = (withSteamCache as jest.Mock).mock.calls.map((call) => call[0]).filter((key: string) => key.startsWith('xbox:feed:'))

    expect(keys).toHaveLength(2)
    expect(keys[1]).not.toBe(firstKey)
    expect(keys[1]).toContain(moved)
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

  test('one game failing leaves a partial feed, marked on the initial and cached responses', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/titles/')) return answer({ titles: [title('1'), title('2')] })
      if (url.endsWith('/1')) throw new Error('boom')
      return answer({ achievements: [earned('x', daysAgo(1))] })
    })
    const res = await withXboxTelemetry('xbox/test', async () => {
      const list = await xboxRecentAchievements(XUID, 'activity', 60)
      expect(list).toHaveLength(1)
      expect(list[0].titleId).toBe('2')
      return NextResponse.json(list)
    })
    expect(res.headers.get('X-Xbox-Partial')).toBe('achievements')
  })

  test('every game failing is a failure, not an empty feed', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/titles/')) return answer({ titles: [title('1'), title('2')] })
      return answer(null, { status: 429, code: 429 })
    })
    await expect(xboxRecentAchievements(XUID, 'activity', 60)).rejects.toMatchObject({ kind: 'rate-limited' })
  })

  test('a 429 stops scheduling new games and never returns a partial feed as complete', async () => {
    const titles = Array.from({ length: 10 }, (_, i) => title(String(i + 1)))
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/titles/')) return answer({ titles })
      if (url.endsWith('/1')) return answer(null, { status: 429, code: 429 })
      return answer({ achievements: [earned('ok', daysAgo(1))] })
    })

    await expect(xboxRecentAchievements(XUID, 'activity', 60)).rejects.toMatchObject({ kind: 'rate-limited' })
    const achievementCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('achievements/player'))
    expect(achievementCalls.length).toBeLessThanOrEqual(3)
    const cacheOptions = (withSteamCache as jest.Mock).mock.calls.filter(([key]) => String(key).startsWith('xbox:achievements:')).map((call) => call[3])
    expect(cacheOptions.length).toBeGreaterThan(0)
    for (const options of cacheOptions) expect(options.staleIfError(new XboxError('rate-limited', 'quota'))).toBe(false)
  })

  test('no game in the window is an empty feed with no calls for achievements', async () => {
    routes({ titles: answer({ titles: [title('1', { titleHistory: { lastTimePlayed: daysAgo(300) } })] }) })
    expect(await xboxRecentAchievements(XUID, 'activity', 60)).toEqual([])
    // The library, and its play time; no achievements.
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([`https://api.xbl.io/v2/titles/${XUID}`, 'https://api.xbl.io/v2/player/stats'])
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
    ['timeout', 504, 'timeout'],
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
