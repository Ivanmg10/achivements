import crypto from 'crypto'

/**
 * Steam authenticates via OpenID 2.0 — NOT OpenID Connect. The `openid-client`
 * dependency only speaks OIDC, and next-auth v4 ships no Steam provider, so the
 * (short, fully specified) OpenID 2.0 dance is implemented here.
 *
 * Flow:
 *   1. Redirect the user to Steam with `checkid_setup` (buildAuthUrl).
 *   2. Steam redirects back to `return_to` with signed assertion params.
 *   3. Echo those params back to Steam with `check_authentication` so Steam
 *      confirms it really signed them (verifyAssertion). Skipping this step
 *      would let anyone forge a callback for any SteamID.
 *   4. Read the SteamID64 out of the claimed_id (extractSteamId).
 */

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login'
const OPENID_NS = 'http://specs.openid.net/auth/2.0'
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select'
const CLAIMED_ID_PREFIX = 'https://steamcommunity.com/openid/id/'
const VERIFY_TIMEOUT = 10_000

/** How long a link attempt stays valid between leaving for Steam and coming back. */
export const STATE_TTL_MS = 10 * 60 * 1000

export function buildAuthUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    'openid.ns': OPENID_NS,
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': IDENTIFIER_SELECT,
    'openid.claimed_id': IDENTIFIER_SELECT,
  })
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`
}

/**
 * Asks Steam to confirm it signed this assertion. Returns false on any
 * network/HTTP failure — an unverifiable assertion is a rejected one.
 */
export async function verifyAssertion(params: URLSearchParams): Promise<boolean> {
  const body = new URLSearchParams(params)
  body.set('openid.mode', 'check_authentication')

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), VERIFY_TIMEOUT)
  try {
    const res = await fetch(STEAM_OPENID_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return false
    const text = await res.text()
    return /(^|\n)is_valid\s*:\s*true/.test(text)
  } catch {
    clearTimeout(timer)
    return false
  }
}

/** Pulls the SteamID64 out of a claimed_id, or null if it is not a Steam identity URL. */
export function extractSteamId(claimedId: string | null): string | null {
  if (!claimedId || !claimedId.startsWith(CLAIMED_ID_PREFIX)) return null
  const id = claimedId.slice(CLAIMED_ID_PREFIX.length)
  return /^\d{17}$/.test(id) ? id : null
}

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET is required to sign Steam link state')
  return s
}

/**
 * CSRF guard. Steam echoes `return_to` back verbatim, so the state travels in
 * it: a signed "this user started a link at time T" token. Binding it to the
 * user id stops a link callback from being replayed against another account.
 */
export function signState(userId: string, issuedAt = Date.now()): string {
  const payload = `${userId}.${issuedAt}`
  const mac = crypto.createHmac('sha256', secret()).update(payload).digest('hex')
  return `${payload}.${mac}`
}

export function verifyState(state: string | null, userId: string, now = Date.now()): boolean {
  if (!state) return false
  const parts = state.split('.')
  if (parts.length !== 3) return false
  const [stateUserId, issuedAtRaw, mac] = parts

  const expected = crypto
    .createHmac('sha256', secret())
    .update(`${stateUserId}.${issuedAtRaw}`)
    .digest('hex')

  const macBuf = Buffer.from(mac, 'hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  if (macBuf.length !== expectedBuf.length) return false
  if (!crypto.timingSafeEqual(macBuf, expectedBuf)) return false

  if (stateUserId !== userId) return false

  const issuedAt = Number(issuedAtRaw)
  if (!Number.isFinite(issuedAt)) return false
  return now - issuedAt >= 0 && now - issuedAt < STATE_TTL_MS
}

/**
 * The origin used to build return_to/realm. Taken from config rather than the
 * request Host header, which a client controls and could point Steam's redirect
 * at an attacker-owned host.
 */
export function configuredOrigin(): string | null {
  const raw = process.env.NEXTAUTH_URL?.trim()
  if (!raw) return null
  try {
    return new URL(raw).origin
  } catch {
    return null
  }
}
