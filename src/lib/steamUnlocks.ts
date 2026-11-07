import pool from '@/lib/db'
import { TWO_WEEKS_S } from '@/utils/steamMappers'
import type { SteamOwnedGame, SteamPlayerAchievement } from '@/types/steam'

/**
 * Steam unlocks kept as they are read (migrations/042_steam_unlocks.sql), so a
 * year's streak can count games nobody asked Steam about on that page load:
 * the score refresh reads every played game's list in the background. Also the
 * hours per game (045), which date a game Steam does not date (#113).
 * None of these functions ever fails the read it rides on.
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

/** The newest kept unlock of each game (unix seconds). Empty when the table cannot be read. */
export async function latestUnlocks(userId: string, steamid: string): Promise<Map<number, number>> {
  try {
    const { rows } = await pool.query(
      `SELECT appid, extract(epoch FROM max(unlocked_at))::bigint AS at
         FROM steam_unlocks WHERE user_id = $1 AND steamid = $2 GROUP BY appid`,
      [userId, steamid],
    )
    return new Map(rows.map((r: { appid: number; at: string }) => [r.appid, Number(r.at)]))
  } catch (err) {
    console.error('[steamUnlocks] latest', err)
    return new Map()
  }
}

export type KeptPlaytime = { appid: number; minutes: number; played: number | null }

/**
 * What a new read of the owned list changes in the kept hours
 * (migrations/045_steam_playtime.sql). A game first seen is kept undated: its
 * hours could be from any time. More minutes than last time mean it was played
 * since: now when Steam counts minutes in the last two weeks, else at most two
 * weeks ago. Fewer minutes (a refund, a family share ending) keep the date.
 */
export function playtimeChanges(kept: Map<number, KeptPlaytime>, games: SteamOwnedGame[], now = Date.now()): KeptPlaytime[] {
  const t = Math.floor(now / 1000)
  return games.flatMap((g) => {
    const before = kept.get(g.appid)
    if (!before) return [{ appid: g.appid, minutes: g.playtime_forever, played: null }]
    if (before.minutes === g.playtime_forever) return []
    const rose = g.playtime_forever > before.minutes
    const played = rose ? ((g.playtime_2weeks ?? 0) > 0 ? t : t - TWO_WEEKS_S) : before.played
    return [{ appid: g.appid, minutes: g.playtime_forever, played }]
  })
}

/**
 * Keeps the hours of these games and answers when each was last seen played
 * (unix seconds), for the games Steam does not date. Empty, and logged, when
 * the table cannot be read: the dates then come from unlocks alone.
 */
export async function observePlaytime(
  userId: string,
  steamid: string,
  games: SteamOwnedGame[],
  now = Date.now(),
): Promise<Map<number, number>> {
  if (games.length === 0) return new Map()
  try {
    const { rows } = await pool.query(
      `SELECT appid, minutes, extract(epoch FROM played_at)::bigint AS played
         FROM steam_playtime WHERE user_id = $1 AND steamid = $2`,
      [userId, steamid],
    )
    const kept = new Map<number, KeptPlaytime>(
      rows.map((r: { appid: number; minutes: number; played: string | null }) => [
        r.appid,
        { appid: r.appid, minutes: r.minutes, played: r.played === null ? null : Number(r.played) },
      ]),
    )
    const changes = playtimeChanges(kept, games, now)
    if (changes.length > 0) {
      await pool.query(
        `INSERT INTO steam_playtime (user_id, steamid, appid, minutes, played_at)
         SELECT $1, $2, appid, minutes, to_timestamp(played) FROM unnest($3::int[], $4::int[], $5::bigint[]) AS t(appid, minutes, played)
         ON CONFLICT (user_id, steamid, appid) DO UPDATE SET minutes = EXCLUDED.minutes, played_at = EXCLUDED.played_at`,
        [userId, steamid, changes.map((c) => c.appid), changes.map((c) => c.minutes), changes.map((c) => c.played)],
      )
      for (const c of changes) kept.set(c.appid, c)
    }
    return new Map([...kept.values()].filter((k) => k.played !== null).map((k) => [k.appid, k.played!]))
  } catch (err) {
    console.error('[steamUnlocks] playtime', err)
    return new Map()
  }
}

/** Drops a user's kept unlocks and hours, when they unlink Steam. Best effort, like the cache. */
export async function forgetUnlocks(userId: string): Promise<void> {
  for (const table of ['steam_unlocks', 'steam_playtime']) {
    try {
      await pool.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId])
    } catch (err) {
      console.error('[steamUnlocks] forget', table, userId, err)
    }
  }
}
