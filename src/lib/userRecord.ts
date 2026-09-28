import { createHash } from 'crypto'
import pool from '@/lib/db'
import type { RetroAchievementsUserProfile } from '@/types/types'

type SavedGame = { id: number; title: string; imageIcon: string } | null

/** A users row as the session needs it. The database is the only source of truth for these. */
export type UserRecord = {
  id: number
  username: string
  password: string
  theme: string
  avatar: string | null
  raid: string | null
  rausername: string | null
  steamid: string | null
  steamusername: string | null
  email: string | null
  /** When the address was confirmed. Null means it never was; nothing is blocked either way. */
  email_verified_at: string | null
  admin: boolean | null
  raUser: RetroAchievementsUserProfile | null
  location: string | null
  favorite_game: SavedGame
  favorite_steam_game: SavedGame
}

const COLUMNS = `id, username, password, theme, avatar, raid, rausername, steamid, steamusername,
  email, email_verified_at, admin, "raUser", location, favorite_game, favorite_steam_game`

// Every API call re-reads the signed-in user (see authOptions' jwt callback); a
// short cache keeps that to about one query per user per minute. A session
// carries when it was last synced with the database (notBefore), and a cached
// row older than that is re-read, so an instance never undoes a change another
// instance already put in the token (e.g. a Steam link that just landed).
// ponytail: per-instance cache; a change made elsewhere that no session has
// synced yet (a password or admin change) can take up to TTL_MS to be seen here.
const TTL_MS = 60_000
const cache = new Map<string, { row: UserRecord | null; at: number }>()

type LoadOptions = { fresh?: boolean; notBefore?: number }

/** The row and when it was read from the database. */
export async function loadUserSynced(
  id: string | number,
  { fresh = false, notBefore = 0 }: LoadOptions = {},
): Promise<{ row: UserRecord | null; at: number }> {
  const key = String(id)
  const hit = cache.get(key)
  if (!fresh && hit && Date.now() - hit.at < TTL_MS && hit.at >= notBefore) return hit

  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [key])
  const entry = { row: (rows[0] as UserRecord | undefined) ?? null, at: Date.now() }
  cache.set(key, entry)
  return entry
}

export async function loadUser(id: string | number, options: LoadOptions = {}): Promise<UserRecord | null> {
  return (await loadUserSynced(id, options)).row
}

export async function loadUserByUsername(username: string): Promise<UserRecord | null> {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM users WHERE username = $1`, [username])
  return (rows[0] as UserRecord | undefined) ?? null
}

/** Drop the cached row after changing it, so this instance sees the change at once. */
export function forgetUser(id: string | number) {
  cache.delete(String(id))
}

/**
 * A short fingerprint of the stored password hash. A session remembers the one
 * it was issued with, so changing the password (which changes the hash) ends
 * every other session. The hash itself never goes into the token.
 */
export function passwordVersion(hash: string): string {
  return createHash('sha256').update(hash).digest('hex').slice(0, 16)
}
