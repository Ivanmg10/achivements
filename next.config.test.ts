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
  expect(csp).not.toMatch(/script-src[^;]*https:/)
  // Avatars are pasted https URLs, so images may come from any https host — but never http.
  expect(csp).toContain("img-src 'self' data: blob: https:")
  expect(csp).not.toMatch(/img-src[^;]*http:/)
})
