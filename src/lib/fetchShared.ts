const inFlight = new Map<string, Promise<Response>>()

/**
 * `fetch` for a GET that several components may ask for at once (a platform's
 * summary, the recent unlocks): while one request for a URL is in flight, the
 * others wait for it and each gets its own copy of the response, so each can
 * read the body. Once it settles the next call asks again — nothing is kept.
 * Anything that is not a GET goes straight through.
 */
export function fetchShared(url: string, init?: RequestInit): Promise<Response> {
  if (init?.method && init.method.toUpperCase() !== 'GET') return fetch(url, init)
  const key = `${init?.cache ?? 'default'}:${url}`
  let request = inFlight.get(key)
  if (!request) {
    // Called as the plain `fetch(url)` when there is nothing to add, as a direct caller would.
    request = (init ? fetch(url, init) : fetch(url)).finally(() => inFlight.delete(key))
    inFlight.set(key, request)
  }
  // The original is never read, only cloned: every caller can consume its own.
  return request.then((res) => (typeof res.clone === 'function' ? res.clone() : res))
}
