import nextConfig from './next.config'

async function headers() {
  const rules = await nextConfig.headers!()
  expect(rules).toHaveLength(1)
  expect(rules[0].source).toBe('/:path*')
  return Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]))
}

test('does not announce the framework', () => {
  expect(nextConfig.poweredByHeader).toBe(false)
})

test('every response carries the security headers', async () => {
  const h = await headers()
  expect(h['X-Frame-Options']).toBe('DENY')
  expect(h['X-Content-Type-Options']).toBe('nosniff')
  expect(h['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
  expect(h['Permissions-Policy']).toContain('camera=()')
})

test('the CSP keeps scripts, connections and framing to this site', async () => {
  const csp = (await headers())['Content-Security-Policy']
  expect(csp).toContain("default-src 'self'")
  expect(csp).toContain("frame-ancestors 'none'")
  expect(csp).toContain("object-src 'none'")
  expect(csp).toContain("base-uri 'self'")
  expect(csp).toContain("form-action 'self'")
  expect(csp).toMatch(/connect-src 'self'/)
  // The only outside script host is Google's tag loader, which runs after cookie consent.
  const scriptHosts = csp.match(/script-src([^;]*)/)![1].split(' ').filter((s) => s.startsWith('https:'))
  expect(scriptHosts).toEqual(['https://www.googletagmanager.com'])
  // Avatars are pasted https URLs, so images may come from any https host — but never http.
  expect(csp).toContain("img-src 'self' data: blob: https:")
  expect(csp).not.toMatch(/img-src[^;]*http:/)
})

test('only preview deployments let in Vercel’s toolbar', async () => {
  expect((await headers())['Content-Security-Policy']).not.toContain('vercel.live')

  jest.resetModules()
  process.env.VERCEL_ENV = 'preview'
  const preview = (await import('./next.config')).default
  const rules = await preview.headers!()
  const csp = rules[0].headers.find((h) => h.key === 'Content-Security-Policy')!.value
  expect(csp).toMatch(/script-src[^;]*https:\/\/vercel\.live/)
  expect(csp).toContain('frame-src https://vercel.live')
  delete process.env.VERCEL_ENV
})

test('builds never reuse Turbopack’s file-system cache (it shipped a stale globals.css)', () => {
  expect(nextConfig.experimental?.turbopackFileSystemCacheForBuild).toBe(false)
})
