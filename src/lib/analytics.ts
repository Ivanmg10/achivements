/**
 * Google Analytics, loaded only after the visitor accepts cookies.
 * Set NEXT_PUBLIC_GA_ID (G-…) in Vercel; without it nothing loads and no banner shows.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

/**
 * What GA is told the page is: path only. Query strings never leave — a reset
 * link carries its token there (`/resetPassword?token=…`).
 */
export function pageLocation(loc: Pick<Location, 'origin' | 'pathname'> = window.location) {
  return loc.origin + loc.pathname
}

/** Turns GA off or back on without a reload, and drops its cookies when off. */
export function setAnalyticsEnabled(on: boolean) {
  if (!GA_ID) return
  ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = !on
  if (on) return
  // GA writes on the top domain (.cheevovault.com); try every level it could be on.
  const host = window.location.hostname
  const domains = ['', host, host.replace(/^www\./, '')]
  document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_'))
    .forEach((name) =>
      domains.forEach((d) => {
        document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`
      }),
    )
}
