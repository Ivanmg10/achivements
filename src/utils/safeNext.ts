const ORIGIN = 'http://same-site.invalid'

/**
 * Where to go after signing in, from a `next` the proxy put in the URL (or anyone typed there): only a
 * path of this very site, otherwise the home page. Never an open redirect, so it refuses anything that
 * could leave the site: a scheme or host (`https://evil.com`, `//evil.com`, `javascript:`), a backslash
 * (browsers read `/\evil.com` as `//evil.com`), a control character (a tab inside `/\t/evil.com` is
 * dropped by the URL parser into `//evil.com`), and a long one. What is kept is the URL's own normal
 * form, checked to still be on this origin. The sign-in page itself and the API are not a place to return to.
 */
export function safeNext(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length > 512 || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  if (raw.includes(String.fromCharCode(92)) || [...raw].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) return '/'
  let url: URL
  try {
    url = new URL(raw, ORIGIN)
  } catch {
    return '/'
  }
  if (url.origin !== ORIGIN || url.pathname.startsWith('//')) return '/'
  if (/^\/(authPage|resetPassword|api)(\/|$)/.test(url.pathname)) return '/'
  return `${url.pathname}${url.search}${url.hash}`
}
