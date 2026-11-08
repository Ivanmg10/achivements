import crypto from 'crypto'
import { NextResponse } from 'next/server'

/**
 * The app's signing and comparison helpers. Each caller keeps its own key
 * derivation (secretBox's purpose, raKey's `:ra-key:hash`): changing one makes
 * what is stored with it unreadable. `secrets.test.ts` pins the outputs.
 */

export function appSecret(): string {
  const value = process.env.NEXTAUTH_SECRET
  if (!value) throw new Error('NEXTAUTH_SECRET is not configured')
  return value
}

/** HMAC-SHA256 of `payload`, in hex, keyed by the app secret unless a derived key is given. */
export function hmacHex(payload: string, key: string = appSecret()): string {
  return crypto.createHmac('sha256', key).update(payload).digest('hex')
}

function sameBytes(given: Buffer, want: Buffer): boolean {
  return given.length === want.length && crypto.timingSafeEqual(given, want)
}

/** Constant-time comparison of two hex signatures. */
export function sameHex(given: string, expected: string): boolean {
  return sameBytes(Buffer.from(given, 'hex'), Buffer.from(expected, 'hex'))
}

/** Constant-time comparison of two strings. */
export function sameText(given: string, expected: string): boolean {
  return sameBytes(Buffer.from(given), Buffer.from(expected))
}

/** One cookie from a raw Cookie header. */
export function cookieFromHeader(header: string | null | undefined, name: string): string | null {
  const found = (header ?? '').split(/;\s*/).find((c) => c.startsWith(`${name}=`))
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null
}

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. The refusal to answer,
 * or null when the call is the cron's; without the variable everyone is refused.
 */
export function cronRefusal(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'cron-not-configured' }, { status: 503 })
  if (!sameText(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
