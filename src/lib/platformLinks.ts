import pool from '@/lib/db'
import { sealRaKey } from '@/lib/raKey'
import { clearUserCache } from '@/lib/steamCache'
import { forgetUnlocks } from '@/lib/steamUnlocks'
import { forgetUser } from '@/lib/userRecord'
import type { GameSource } from '@/types/game'

/**
 * The SQL that links and unlinks a platform, shared by the user routes and the admin one (audit AP-02).
 * Each route keeps its own auth, checks, answers, mails and logging; only the write and what an unlink
 * clears live here. Column names are this file's constants; every value is a parameter.
 */

/** PSN online IDs: 3–16 letters, digits, hyphens or underscores. */
export const PSN_ONLINE_ID = /^[A-Za-z0-9_-]{3,16}$/

/** What a link stores, in the order of its values. Steam's proven sign-in (`steam_login_id`) is set only by Steam's callback. */
const LINK_COLUMNS: Record<GameSource, string[]> = {
  ra: ['"raUser"', 'rausername', 'raid', 'raid_hash'],
  steam: ['steamid', 'steamusername'],
  psn: ['psnaccountid', 'psnusername'],
  xbox: ['xboxxuid', 'xboxgamertag'],
}

/** What an unlink clears: the link, and for Steam the sign-in that came with it (audit SEC-01). */
const UNLINK_COLUMNS: Record<GameSource, string[]> = { ...LINK_COLUMNS, steam: [...LINK_COLUMNS.steam, 'steam_login_id'] }

export function linkSql(platform: GameSource): string {
  const columns = LINK_COLUMNS[platform]
  return `UPDATE users SET ${columns.map((c, i) => `${c} = $${i + 1}`).join(', ')} WHERE id = $${columns.length + 1}`
}

/** `returning` reads back who to mail (Steam's unlink notice). */
export function unlinkSql(platform: GameSource, returning = false): string {
  const set = UNLINK_COLUMNS[platform].map((c) => `${c} = NULL`).join(', ')
  return `UPDATE users SET ${set} WHERE id = $1${returning ? ' RETURNING username, email' : ''}`
}

type UserId = string | number

/** Stores an RA account RA accepted, with its key sealed. Throws `23505` when the key already links another account. */
export async function saveRaLink(userId: UserId, profile: { User?: unknown }, apiKey: string): Promise<void> {
  const { sealed, hash } = sealRaKey(apiKey)
  await pool.query(linkSql('ra'), [JSON.stringify(profile), profile.User, sealed, hash, userId])
}

/** Stores a typed link (admin Steam, PSN, Xbox): the platform's id, then its name. */
export async function saveLink(userId: UserId, platform: Exclude<GameSource, 'ra'>, id: string, name: string | null): Promise<void> {
  await pool.query(linkSql(platform), [id, name, userId])
}

/**
 * Unlinks a platform: clears its columns, then the cached data (and Steam's kept unlocks and play time)
 * and the cached user row. Throws only when the write fails, before anything else is touched; the
 * housekeeping is best effort, since the link is already gone. Answers the row `returning` read.
 */
export async function unlinkPlatform(
  userId: UserId,
  platform: GameSource,
  returning = false,
): Promise<{ username: string; email: string | null } | null> {
  const { rows } = await pool.query(unlinkSql(platform, returning), [userId])
  await clearUserCache(String(userId))
  if (platform === 'steam') await forgetUnlocks(String(userId))
  forgetUser(userId)
  return rows?.[0] ?? null
}
