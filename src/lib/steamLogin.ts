import crypto from 'crypto'

/**
 * Sign in with Steam: Steam's OpenID 2.0, which proves a SteamID64 and nothing
 * else (no name, picture or email: those come from the Web API, the email from
 * the user). The proven id travels from the callback to the sign-in and the
 * sign-up as a short signed ticket in an httpOnly cookie scoped to /api/auth.
 */
const OPENID = 'https://steamcommunity.com/openid/login'
const CLAIMED_ID = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/
/** What Steam must have signed, or a forged value could ride along unsigned. */
const MUST_SIGN = ['claimed_id', 'identity', 'return_to', 'response_nonce', 'op_endpoint']

export const STEAM_TICKET_COOKIE = 'steam-login'
export const STEAM_STATE_COOKIE = 'steam-state'
export const TICKET_TTL_MS = 10 * 60 * 1000
export const CALLBACK_PATH = '/api/auth/steam/callback'

/** Links go out from NEXTAUTH_URL, as the reset and verification ones do. */
export function siteBase(fallback: string): string {
  return (process.env.NEXTAUTH_URL || fallback).replace(/\/$/, '')
}

/** `back` rides on the return URL (signed by Steam): the intent, the state, where to return. */
export function steamLoginUrl(base: string, back: URLSearchParams): string {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${base}${CALLBACK_PATH}?${back}`,
    'openid.realm': base,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })
  return `${OPENID}?${params}`
}

/**
 * The SteamID64 Steam vouches for in a callback's query, or null when the
 * answer is not one (cancelled, tampered, for another site). Steam is asked to
 * confirm its own signature; throws when it cannot be reached.
 */
export async function verifySteamLogin(query: URLSearchParams, base: string): Promise<string | null> {
  if (query.get('openid.mode') !== 'id_res' || query.get('openid.op_endpoint') !== OPENID) return null
  if ((query.get('openid.return_to') ?? '').split('?')[0] !== `${base}${CALLBACK_PATH}`) return null
  const claimed = query.get('openid.claimed_id') ?? ''
  const match = claimed.match(CLAIMED_ID)
  if (!match || query.get('openid.identity') !== claimed) return null
  const signed = (query.get('openid.signed') ?? '').split(',')
  if (!MUST_SIGN.every((field) => signed.includes(field))) return null

  const body = new URLSearchParams(query)
  body.set('openid.mode', 'check_authentication')
  const res = await fetch(OPENID, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Steam OpenID answered ${res.status}`)
  return /^is_valid\s*:\s*true$/m.test(await res.text()) ? match[1] : null
}

function mac(payload: string): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not configured')
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export function signTicket(steamid: string, issuedAt = Date.now()): string {
  const payload = `${steamid}.${issuedAt}`
  return `${payload}.${mac(payload)}`
}

/** The SteamID64 a ticket carries, or null when it is missing, forged or stale. */
export function readTicket(ticket: string | null | undefined, now = Date.now()): string | null {
  const [steamid, issuedAt, signature] = (ticket ?? '').split('.')
  if (!steamid || !issuedAt || !signature || !/^\d{17}$/.test(steamid)) return null
  const given = Buffer.from(signature, 'hex')
  const want = Buffer.from(mac(`${steamid}.${issuedAt}`), 'hex')
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null
  const age = now - Number(issuedAt)
  return age >= 0 && age <= TICKET_TTL_MS ? steamid : null
}

/** Set-Cookie for a ticket: only /api/auth (the sign-up route and NextAuth's sign-in) ever sees it. */
export function ticketCookie(ticket: string, secure: boolean): string {
  return `${STEAM_TICKET_COOKIE}=${encodeURIComponent(ticket)}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=${TICKET_TTL_MS / 1000}${secure ? '; Secure' : ''}`
}

/**
 * Set-Cookie for the random `state` a trip to Steam starts with. The callback
 * only acts when the signed `return_to` carries the same value, so a callback
 * link someone else made (with their Steam account) does nothing in your
 * browser: without it, it could link their Steam to your account.
 */
export function stateCookie(state: string, secure: boolean): string {
  return `${STEAM_STATE_COOKIE}=${state}; Path=${CALLBACK_PATH}; HttpOnly; SameSite=Lax; Max-Age=${TICKET_TTL_MS / 1000}${secure ? '; Secure' : ''}`
}

/** One cookie from a raw Cookie header (NextAuth's authorize gets headers, not cookies). */
export function cookieFromHeader(header: string | null | undefined, name: string): string | null {
  const found = (header ?? '').split(/;\s*/).find((c) => c.startsWith(`${name}=`))
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null
}

export function ticketFromCookieHeader(header: string | null | undefined): string | null {
  return cookieFromHeader(header, STEAM_TICKET_COOKIE)
}

/** Where a link started from may be sent back to; anything else goes to the account page. */
const LINK_RETURNS = ['/', '/user']
export function linkReturn(path: string | null | undefined): string {
  return path && LINK_RETURNS.includes(path) ? path : '/user'
}

/** What we asked Steam to send back (intent, state, return path): read from `openid.return_to`, which Steam signs. */
export function returnParams(query: URLSearchParams): URLSearchParams {
  try {
    return new URL(query.get('openid.return_to') ?? '').searchParams
  } catch {
    return new URLSearchParams()
  }
}

/** A Steam name as a CheevoVault username, when it can be one; '' to make the user choose. */
export function usernameFromPersona(persona: string): string {
  const name = persona.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
  return name.length >= 3 ? name : ''
}
