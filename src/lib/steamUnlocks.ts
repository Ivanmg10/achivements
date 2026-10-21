import pool from '@/lib/db'
import type { SteamPlayerAchievement } from '@/types/steam'

/**
 * Steam unlocks kept as they are read (migrations/042_steam_unlocks.sql), so a
 * year's streak can count games nobody asked Steam about on that page load:
 * the score refresh reads every played game's list in the background.
 * Neither function ever fails the read it rides on.
 */

/** Keeps a game's dated unlocks. Unlocks only grow, so a row once written stays right. */
export async function recordUnlocks(
  userId: string,
  steamid: string,
  appId: number,
  achievements: SteamPlayerAchievement[],
): Promise<void> {
  const dated = achievements.filter((a) => a.achieved === 1 && a.unlocktime > 0)
  if (dated.length === 0) return
  try {
    await pool.query(
      `INSERT INTO steam_unlocks (user_id, steamid, appid, apiname, unlocked_at)
       SELECT $1, $2, $3, name, to_timestamp(at) FROM unnest($4::text[], $5::bigint[]) AS t(name, at)
       ON CONFLICT DO NOTHING`,
      [userId, steamid, appId, dated.map((a) => a.apiname), dated.map((a) => a.unlocktime)],
    )
  } catch (err) {
    console.error('[steamUnlocks] record', appId, err)
  }
}

export type StoredUnlock = { appId: number; apiname: string; unlocktime: number }

/** The kept unlocks of these games since `since` (unix seconds). Empty when the table cannot be read. */
export async function storedUnlocks(
  userId: string,
  steamid: string,
  appIds: number[],
  since: number,
): Promise<StoredUnlock[]> {
  if (appIds.length === 0) return []
  try {
    const { rows } = await pool.query(
      `SELECT appid, apiname, extract(epoch FROM unlocked_at)::bigint AS at
         FROM steam_unlocks
        WHERE user_id = $1 AND steamid = $2 AND appid = ANY($3) AND unlocked_at >= to_timestamp($4)`,
      [userId, steamid, appIds, since],
    )
    return rows.map((r: { appid: number; apiname: string; at: string }) => ({
      appId: r.appid,
      apiname: r.apiname,
      unlocktime: Number(r.at),
    }))
  } catch (err) {
    console.error('[steamUnlocks] read', err)
    return []
  }
}

/** Drops a user's kept unlocks, when they unlink Steam. Best effort, like the cache. */
export async function forgetUnlocks(userId: string): Promise<void> {
  try {
    await pool.query('DELETE FROM steam_unlocks WHERE user_id = $1', [userId])
  } catch (err) {
    console.error('[steamUnlocks] forget', userId, err)
  }
}
