import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { authOptions } from '@/lib/authOptions'
import { loadUser, passwordVersion } from '@/lib/userRecord'

/**
 * Admin access has two locks. Being admin is read from the database on every
 * request, never from the session: someone just demoted loses access now.
 * And the admin panel must be unlocked with the admin's own password, which
 * lasts ELEVATION_MS: a stolen or forgotten-open session alone cannot read
 * every user's email or take over an account.
 *
 * The unlock is a cookie signed with the app secret, bound to the admin and
 * to their current password hash, so changing the password ends it too.
 */
export const ELEVATION_COOKIE = 'admin-elevation'
export const ELEVATION_MS = 15 * 60 * 1000
/** What the admin endpoints answer when the panel has to be unlocked again. */
export const REAUTH_REQUIRED = 'reauth-required'

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET
  if (!value) throw new Error('NEXTAUTH_SECRET is not configured')
  return value
}

function mac(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex')
}

export function signElevation(userId: string, pwv: string, expiresAt: number): string {
  const payload = `${userId}.${pwv}.${expiresAt}`
  return `${payload}.${mac(payload)}`
}

/** Whether a cookie value is a live unlock for this admin and this password. */
export function verifyElevation(value: string | null, userId: string, pwv: string, now = Date.now()): boolean {
  if (!value) return false
  const parts = value.split('.')
  if (parts.length !== 4) return false
  const [id, version, expiresRaw, signature] = parts

  const given = Buffer.from(signature, 'hex')
  const want = Buffer.from(mac(`${id}.${version}.${expiresRaw}`), 'hex')
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return false

  const expiresAt = Number(expiresRaw)
  return id === userId && version === pwv && Number.isFinite(expiresAt) && expiresAt > now
}

/** One cookie out of a Cookie header. */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

/** Set-Cookie for an unlock (or, with no value, for ending it). Only the admin API ever sees it. */
export function elevationCookie(value: string | null, maxAgeSeconds = ELEVATION_MS / 1000): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return value
    ? `${ELEVATION_COOKIE}=${encodeURIComponent(value)}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`
    : `${ELEVATION_COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
}

export type AdminIdentity = { id: string; username: string; pwv: string }
export type AdminResult = { ok: true; admin: AdminIdentity } | { ok: false; response: NextResponse }

/** A signed-in admin, read fresh from the database; without the unlock check. */
export async function requireAdminRole(): Promise<AdminResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const row = await loadUser(session.user.id, { fresh: true })
  if (row?.admin !== true) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true, admin: { id: String(row.id), username: row.username, pwv: passwordVersion(row.password) } }
}

/** A signed-in admin who has unlocked the panel with their password. */
export async function requireAdmin(req: Request): Promise<AdminResult> {
  const result = await requireAdminRole()
  if (!result.ok) return result
  const { admin } = result
  if (!verifyElevation(readCookie(req, ELEVATION_COOKIE), admin.id, admin.pwv)) {
    return { ok: false, response: NextResponse.json({ error: REAUTH_REQUIRED }, { status: 403 }) }
  }
  return result
}

export type AdminAction =
  | 'unlock'
  | 'create-user'
  | 'update-user'
  | 'delete-user'
  | 'link-ra'
  | 'unlink-ra'
  | 'link-steam'
  | 'unlink-steam'
  | 'psn-token'

/** How long the action log is kept. */
const ACTION_LOG_DAYS = 365

/**
 * Records what an admin did, to whom and when. The target's name is copied in,
 * so the entry still reads after the account is deleted. Never throws: the
 * action already happened, and a failed log line must not undo or hide it.
 */
export async function logAdminAction(
  admin: Pick<AdminIdentity, 'id' | 'username'>,
  action: AdminAction,
  target: { id: number | string; username: string } | null,
  detail: Record<string, unknown> | null = null,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO admin_actions (admin_id, admin_username, target_user_id, target_username, action, detail)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [admin.id, admin.username, target?.id ?? null, target?.username ?? null, action, detail ? JSON.stringify(detail) : null],
    )
    // Cheap housekeeping, as in attemptLimit: drop what is past its time now and then.
    if (Math.random() < 0.05) {
      await pool.query(`DELETE FROM admin_actions WHERE created_at < NOW() - ($1 || ' days')::interval`, [String(ACTION_LOG_DAYS)])
    }
  } catch (err) {
    console.error('[adminAuth] could not log', action, err)
  }
}
