import {
  buildAuthUrl,
  verifyAssertion,
  extractSteamId,
  returnsHere,
  readSteamId,
  signState,
  verifyState,
  configuredOrigin,
  siteOrigin,
  STATE_TTL_MS,
} from './steamOpenId'

const STEAM_ID = '76561198000000000'

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  jest.restoreAllMocks()
})

describe('buildAuthUrl', () => {
  test('builds a checkid_setup request with identifier_select', () => {
    const url = new URL(buildAuthUrl('http://localhost:3000/api/steam/callback', 'http://localhost:3000/'))
    expect(url.origin + url.pathname).toBe('https://steamcommunity.com/openid/login')
    expect(url.searchParams.get('openid.mode')).toBe('checkid_setup')
    expect(url.searchParams.get('openid.ns')).toBe('http://specs.openid.net/auth/2.0')
    expect(url.searchParams.get('openid.identity')).toBe('http://specs.openid.net/auth/2.0/identifier_select')
    expect(url.searchParams.get('openid.claimed_id')).toBe('http://specs.openid.net/auth/2.0/identifier_select')
    expect(url.searchParams.get('openid.return_to')).toBe('http://localhost:3000/api/steam/callback')
    expect(url.searchParams.get('openid.realm')).toBe('http://localhost:3000/')
  })
})

describe('verifyAssertion', () => {
  test('posts check_authentication and accepts is_valid:true', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => 'ns:...\nis_valid:true\n' })
    global.fetch = fetchMock as unknown as typeof fetch

    const params = new URLSearchParams({ 'openid.mode': 'id_res', 'openid.sig': 'abc' })
    await expect(verifyAssertion(params)).resolves.toBe(true)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://steamcommunity.com/openid/login')
    expect(init.method).toBe('POST')
    // The echoed params must carry check_authentication, not the original mode.
    expect(init.body).toContain('openid.mode=check_authentication')
    expect(init.body).toContain('openid.sig=abc')
  })

  test('rejects is_valid:false', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => 'is_valid:false\n' }) as unknown as typeof fetch
    await expect(verifyAssertion(new URLSearchParams())).resolves.toBe(false)
  })

  test('rejects on non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, text: async () => '' }) as unknown as typeof fetch
    await expect(verifyAssertion(new URLSearchParams())).resolves.toBe(false)
  })

  test('rejects when the verification call throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch
    await expect(verifyAssertion(new URLSearchParams())).resolves.toBe(false)
  })
})

describe('extractSteamId', () => {
  test('extracts a 17-digit SteamID64', () => {
    expect(extractSteamId(`https://steamcommunity.com/openid/id/${STEAM_ID}`)).toBe(STEAM_ID)
  })

  test('rejects null, a foreign host, and a malformed id', () => {
    expect(extractSteamId(null)).toBeNull()
    expect(extractSteamId(`https://evil.example.com/openid/id/${STEAM_ID}`)).toBeNull()
    expect(extractSteamId('https://steamcommunity.com/openid/id/not-a-number')).toBeNull()
    expect(extractSteamId('https://steamcommunity.com/openid/id/123')).toBeNull()
  })
})

describe('signState / verifyState', () => {
  test('round-trips for the same user', () => {
    expect(verifyState(signState('7'), '7')).toBe(true)
  })

  test('rejects a state issued for another user', () => {
    expect(verifyState(signState('7'), '8')).toBe(false)
  })

  test('rejects a tampered mac', () => {
    const state = signState('7')
    const tampered = state.slice(0, -1) + (state.endsWith('a') ? 'b' : 'a')
    expect(verifyState(tampered, '7')).toBe(false)
  })

  test('rejects a mac signed with a different secret', () => {
    const state = signState('7')
    process.env.NEXTAUTH_SECRET = 'other-secret'
    expect(verifyState(state, '7')).toBe(false)
  })

  test('rejects malformed and missing state', () => {
    expect(verifyState(null, '7')).toBe(false)
    expect(verifyState('nope', '7')).toBe(false)
    expect(verifyState('7.123', '7')).toBe(false)
  })

  test('rejects a mac of the wrong length', () => {
    expect(verifyState('7.123.abcd', '7')).toBe(false)
  })

  test('rejects a non-numeric timestamp', () => {
    const state = signState('7')
    const [userId, , mac] = state.split('.')
    expect(verifyState(`${userId}.abc.${mac}`, '7')).toBe(false)
  })

  test('expires after the TTL and rejects a future timestamp', () => {
    const issuedAt = Date.now()
    const state = signState('7', issuedAt)
    expect(verifyState(state, '7', issuedAt + STATE_TTL_MS + 1)).toBe(false)
    expect(verifyState(state, '7', issuedAt - 1)).toBe(false)
  })

  test('throws when NEXTAUTH_SECRET is missing', () => {
    delete process.env.NEXTAUTH_SECRET
    expect(() => signState('7')).toThrow('NEXTAUTH_SECRET')
  })
})

describe('configuredOrigin', () => {
  test('returns the origin from NEXTAUTH_URL, ignoring path', () => {
    process.env.NEXTAUTH_URL = 'https://app.example.com/some/path'
    expect(configuredOrigin()).toBe('https://app.example.com')
  })

  test('returns null when unset or unparseable', () => {
    delete process.env.NEXTAUTH_URL
    expect(configuredOrigin()).toBeNull()
    process.env.NEXTAUTH_URL = 'not a url'
    expect(configuredOrigin()).toBeNull()
  })
})

describe('siteOrigin', () => {
  const VARS = ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL']
  beforeEach(() => {
    process.env.NEXTAUTH_URL = 'https://prod.example.com'
    VARS.forEach((v) => delete process.env[v])
  })
  afterEach(() => VARS.forEach((v) => delete process.env[v]))

  test('the configured origin itself is used as is', () => {
    expect(siteOrigin('https://prod.example.com/api/steam/link')).toBe('https://prod.example.com')
  })

  test.each(VARS)('a host Vercel assigned through %s is trusted', (name) => {
    process.env[name] = 'app-git-branch.vercel.app'
    expect(siteOrigin('https://app-git-branch.vercel.app/api/steam/link')).toBe('https://app-git-branch.vercel.app')
  })

  test('any other host falls back to NEXTAUTH_URL, so a forged Host cannot steer the redirect', () => {
    process.env.VERCEL_URL = 'app-abc.vercel.app'
    expect(siteOrigin('https://evil.example/api/steam/link')).toBe('https://prod.example.com')
    expect(siteOrigin('http://app-abc.vercel.app/api/steam/link')).toBe('https://prod.example.com')
  })

  test('with nothing configured and no trusted host there is no origin', () => {
    delete process.env.NEXTAUTH_URL
    expect(siteOrigin('https://evil.example/x')).toBeNull()
    expect(siteOrigin('not a url')).toBeNull()
  })
})

describe('returnsHere', () => {
  const ORIGIN = 'https://www.cheevovault.com'
  const params = (overrides: Record<string, string> = {}) =>
    new URLSearchParams({
      'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
      'openid.return_to': `${ORIGIN}/api/steam/callback?state=abc`,
      'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
      state: 'abc',
      ...overrides,
    })

  test('accepts an assertion made for this callback', () => {
    expect(returnsHere(params(), ORIGIN)).toBe(true)
  })

  test.each([
    ['another site', { 'openid.return_to': 'https://evil.test/api/steam/callback?state=abc' }],
    ['another path', { 'openid.return_to': `${ORIGIN}/elsewhere?state=abc` }],
    ['another state', { 'openid.return_to': `${ORIGIN}/api/steam/callback?state=xyz` }],
    ['an unparseable return_to', { 'openid.return_to': 'not a url' }],
    ['another provider', { 'openid.op_endpoint': 'https://evil.test/openid' }],
    ['a signature that leaves the identity out', { 'openid.signed': 'signed,op_endpoint,return_to' }],
  ])('refuses an assertion for %s', (_, overrides) => {
    expect(returnsHere(params(overrides), ORIGIN)).toBe(false)
  })
})

describe('readSteamId', () => {
  test('takes the bare ID or a profile link', () => {
    expect(readSteamId('76561198000000000')).toBe('76561198000000000')
    expect(readSteamId(' https://steamcommunity.com/profiles/76561198000000000/ ')).toBe('76561198000000000')
  })

  test('anything else is not one', () => {
    expect(readSteamId('https://steamcommunity.com/id/gaben')).toBeNull()
    expect(readSteamId('7656119800000000')).toBeNull()
    expect(readSteamId(42)).toBeNull()
  })
})
