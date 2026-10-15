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
  isGamertag,
  isTitleId,
  isXuid,
  xboxAchievements,
  xboxCall,
  xboxConfigured,
  xboxFailure,
  XboxError,
  xboxLibrary,
  xboxRateLimit,
} from './xboxClient'
import { withSteamCache } from '@/lib/steamCache'
import { RAW_360_ACHIEVEMENT, RAW_360_TITLE, RAW_ACHIEVED, RAW_MODERN_TITLE, RAW_PROFILE } from '@/test-utils/xboxFixtures'

const fetchMock = jest.fn()

/** What OpenXBL answers: an HTTP status, the rate-limit headers and a body that carries its own code. */
function answer(content: unknown, { status = 200, code = 200, remaining = '147' }: { status?: number; code?: number; remaining?: string | null } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name === 'x-ratelimit-remaining' ? remaining : name === 'x-ratelimit-limit' ? '150' : null) },
    json: async () => ({ content, code }),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = fetchMock
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
    expect(isXuid('2535400000000001')).toBe(true)
    expect(isXuid('12/../x')).toBe(false)
    expect(isXuid('123')).toBe(false)
    expect(isTitleId('1738914043')).toBe(true)
    expect(isTitleId('12345678901')).toBe(false)
    expect(isTitleId('1a')).toBe(false)
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
    expect(await findXboxAccount(' Name#1234 ')).toMatchObject({ xuid: '2535400000000001', gamertag: 'TestPlayer' })
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.xbl.io/v2/friends/search?gt=Name%231234')
    expect(withSteamCache).toHaveBeenCalledWith('xbox:account:v1:name#1234', expect.any(Number), expect.any(Function), expect.any(Object))
  })

  test('no such account is null, and is not cached', async () => {
    fetchMock.mockResolvedValue(answer({ profileUsers: [] }))
    expect(await findXboxAccount('nobody')).toBeNull()
    const { shouldCache } = (withSteamCache as jest.Mock).mock.calls[0][3]
    expect(shouldCache(null)).toBe(false)
    expect(shouldCache({ xuid: '1' })).toBe(true)
  })
})

describe('xboxLibrary', () => {
  test('maps every title, most recently played first', async () => {
    fetchMock.mockResolvedValue(answer({ titles: [RAW_360_TITLE, RAW_MODERN_TITLE] }))
    const games = await xboxLibrary('2535400000000001')
    expect(games.map((g) => g.name)).toEqual(['Modern Game', 'Old Game'])
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.xbl.io/v2/titles/2535400000000001')
  })

  test('an account with no titles is an empty library', async () => {
    fetchMock.mockResolvedValue(answer({}))
    expect(await xboxLibrary('2535400000000001')).toEqual([])
  })

  test('the refresh button may replace it', async () => {
    fetchMock.mockResolvedValue(answer({ titles: [] }))
    await xboxLibrary('2535400000000001')
    expect((withSteamCache as jest.Mock).mock.calls[0][3]).toEqual({ refreshable: true })
  })
})

describe('xboxAchievements', () => {
  test('a modern game uses the player endpoint', async () => {
    fetchMock.mockResolvedValue(answer({ achievements: [RAW_ACHIEVED] }))
    const list = await xboxAchievements('2535400000000001', '1738914043', false)
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ name: 'Prologue', gamerscore: 10, unlocked: true })
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.xbl.io/v2/achievements/player/2535400000000001/1738914043')
  })

  test('an Xbox 360 game uses its own endpoint and shape', async () => {
    fetchMock.mockResolvedValue(answer({ achievements: [RAW_360_ACHIEVEMENT] }))
    const list = await xboxAchievements('2535400000000001', '1096157159', true)
    expect(list[0]).toMatchObject({ id: '49', gamerscore: 30, unlocked: true })
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.xbl.io/v2/achievements/x360/2535400000000001/title/1096157159')
  })

  test('the 360 and modern lists are cached apart', async () => {
    fetchMock.mockResolvedValue(answer({ achievements: [] }))
    await xboxAchievements('2535400000000001', '5', true)
    await xboxAchievements('2535400000000001', '5', false)
    const keys = (withSteamCache as jest.Mock).mock.calls.map((c) => c[0])
    expect(new Set(keys).size).toBe(2)
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

  test('a refused key is logged for the admin to see, since it is not the caller\'s doing', () => {
    xboxFailure(new XboxError('unauthorized', 'refused'), 'test')
    expect(console.error).toHaveBeenCalled()
  })
})
