import { configuredOrigin, siteOrigin } from './siteUrl'

beforeEach(() => {
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
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
    expect(siteOrigin('https://prod.example.com/api/cron/psnToken')).toBe('https://prod.example.com')
  })

  test.each(VARS)('a host Vercel assigned through %s is trusted', (name) => {
    process.env[name] = 'app-git-branch.vercel.app'
    expect(siteOrigin('https://app-git-branch.vercel.app/api/cron/psnToken')).toBe('https://app-git-branch.vercel.app')
  })

  test('any other host falls back to NEXTAUTH_URL, so a forged Host cannot steer a link', () => {
    process.env.VERCEL_URL = 'app-abc.vercel.app'
    expect(siteOrigin('https://evil.example/api/cron/psnToken')).toBe('https://prod.example.com')
    expect(siteOrigin('http://app-abc.vercel.app/api/cron/psnToken')).toBe('https://prod.example.com')
  })

  test('with nothing configured and no trusted host there is no origin', () => {
    delete process.env.NEXTAUTH_URL
    expect(siteOrigin('https://evil.example/x')).toBeNull()
    expect(siteOrigin('not a url')).toBeNull()
  })
})
