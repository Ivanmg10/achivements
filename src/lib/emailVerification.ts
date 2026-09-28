import crypto from 'crypto'

/**
 * Email verification links, signed rather than stored.
 *
 * Unlike a password reset — which must be single use, because following it
 * twice could hand an account to whoever saw the link second — verifying an
 * address is idempotent. So there is nothing to spend, and no row to write at
 * sign-up: the link carries who it is for and is signed with the app secret.
 *
 * The address is part of what is signed, so a link stops working the moment
 * the account's email changes. Someone who typed the wrong address cannot
 * verify the right one with the old link.
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET
  if (!value) throw new Error('NEXTAUTH_SECRET is not configured')
  return value
}

function mac(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex')
}

export function signVerification(userId: string | number, email: string, issuedAt = Date.now()): string {
  const payload = `${userId}.${email.toLowerCase()}.${issuedAt}`
  return `${Buffer.from(payload).toString('base64url')}.${mac(payload)}`
}

export type Verification = { userId: string; email: string }

/** Who a token is for, or null when it is malformed, forged or stale. */
export function readVerification(token: string | null, now = Date.now()): Verification | null {
  if (!token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  let payload: string
  try {
    payload = Buffer.from(encoded, 'base64url').toString()
  } catch {
    return null
  }

  const expected = mac(payload)
  const given = Buffer.from(signature, 'hex')
  const want = Buffer.from(expected, 'hex')
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null

  // An address has dots of its own, so the payload is read from its ends in:
  // the id is the first field, the timestamp the last, the address the rest.
  const parts = payload.split('.')
  if (parts.length < 3) return null
  const userId = parts[0]
  const issuedAtRaw = parts[parts.length - 1]
  const email = parts.slice(1, -1).join('.')
  if (!userId || !email) return null

  const issuedAt = Number(issuedAtRaw)
  if (!Number.isFinite(issuedAt) || now - issuedAt > TTL_MS || issuedAt > now) return null

  return { userId, email }
}

/** The link that goes in the email. */
export function verificationUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? ''
  return `${base}/api/auth/verifyEmail?token=${encodeURIComponent(token)}`
}
