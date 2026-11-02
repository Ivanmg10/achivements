// Counts the /api requests each main route makes on a full load, signed in (#101).
// Run it against a local server with the Playwright MCP (`browser_run_code_unsafe`
// with `filename: scripts/measure-api-calls.js`) or `playwright-cli run-code`, in a
// browser already signed in. Same environment before and after, or the numbers
// do not compare. Data/actions are every /api answer that is not an image, as in
// #86's table; bytes are decoded. It only reads pages: no clicks, no writes.
// The file is the function itself, as run-code takes it: an expression on purpose.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const ORIGIN = new URL(page.url()).origin
  const SETTLE_MS = 4000 // past the home's idle mount (2 s) and the Steam fill passes

  async function measure(path) {
    const seen = []
    const onResponse = async (res) => {
      const url = new URL(res.url())
      if (url.origin !== ORIGIN || !url.pathname.startsWith('/api/')) return
      const type = res.headers()['content-type'] ?? ''
      const image = type.startsWith('image/')
      let bytes = 0
      if (!image) bytes = await res.body().then((b) => b.length).catch(() => 0)
      seen.push({ path: url.pathname, image, bytes })
    }
    page.on('response', onResponse)
    await page.goto(ORIGIN + path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(SETTLE_MS)
    await page.waitForLoadState('networkidle')
    page.off('response', onResponse)
    const data = seen.filter((r) => !r.image)
    const counts = {}
    for (const r of data) counts[r.path] = (counts[r.path] ?? 0) + 1
    return {
      route: path,
      all: seen.length,
      data: data.length,
      kb: Math.round(data.reduce((n, r) => n + r.bytes, 0) / 1024),
      repeated: Object.entries(counts).filter(([, n]) => n > 1).map(([p, n]) => `${p}×${n}`),
      calls: counts,
    }
  }

  // The ids come from the home's own links, so the script works on any account.
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE_MS)
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))
  const first = (re) => hrefs.find((h) => h && re.test(h))
  const me = first(/^\/user\/[^/]+$/)

  const routes = [
    '/',
    '/playing',
    first(/^\/gameInfo\/\d+/),
    first(/^\/steamGame\/\d+/),
    first(/^\/psnGame\/[^/]+$/),
    first(/^\/xboxGame\/[^/]+$/),
    '/groups',
    first(/^\/groups\/\d+/),
    '/following',
    '/rankings',
    '/racha',
    '/user',
    me,
  ].filter(Boolean)

  const results = []
  for (const route of routes) results.push(await measure(route))
  return results
}
