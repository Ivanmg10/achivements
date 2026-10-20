import pool from '@/lib/db'
import { queryRows } from '@/lib/queryRows'
import { getGameInfoAndUserProgress, getUserCompletionProgress } from '@/lib/raClient'
import { getOwnedGames } from '@/lib/steamClient'
import { withSteamCache } from '@/lib/steamCache'
import { fetchPlayerAchievements, isNoStats, loadGlobalPct } from '@/lib/steamProgress'
import { psnGameTrophies, psnTitles } from '@/lib/psnClient'
import { xboxGameAchievements, xboxLibrary } from '@/lib/xboxClient'
import type { GameSource, SteamOwnedGamesResponse } from '@/types/steam'
import type { TrophyCounts } from '@/types/psn'
import { isConsoleShown } from '@/utils/consoleFilter'
import { RULES_VERSION, looksUnlockedByTool, provisionalScore, scoreGame, stackFactors, stackKey, type GameScore, type ScoreUnlock } from '@/utils/vaultScore'
import { hiddenConsolesFrom, psnGradeShare, psnScoreInputs, raScoreInputs, steamScoreInputs, xboxScoreInputs } from '@/utils/vaultScoreInputs'
import { monthStart, weekStart } from '@/utils/vaultLevel'

/**
 * Keeps a user's Vault Points up to date (docs/rankings-plan.md). Each
 * platform's library is listed once; only games whose last unlock moved since
 * they were scored are read again, a few per run, newest first. A game not
 * read yet scores provisionally from its progress in the list, so nobody sees
 * a zero while their library fills in. Nothing here throws to the caller.
 */

/** How long a score counts as fresh, and how soon an unfinished fill comes back. */
const FRESH_HOURS = 6
const RETRY_MINUTES = 10
/** Games read per platform per run. Xbox's whole app shares 150 calls an hour. */
const READS: Record<GameSource, number> = { ra: 25, steam: 40, psn: 15, xbox: 5 }
const RA_PAGE = 500
const STEAM_OWNED_TTL_MS = 60 * 60 * 1000

type Candidate = {
  id: number
  title: string
  /** As the library labels it, for the consoles the user unticked. */
  console: string
  /** What the library says about the last unlock; a change means the game moved. */
  changeKey: string
  /** From the list alone; null when the list does not say what was earned (Steam). */
  provisional: GameScore | null
  read: () => Promise<{ score: GameScore; suspect: boolean }>
}

type StoredRow = {
  game_id: string
  account: string
  title: string
  points: number
  change_key: string | null
  rules_version: number
  provisional: boolean
  flag: 'suspect' | 'cleared' | null
}

type UserRow = {
  id: number
  rausername: string | null
  raid: string | null
  steamid: string | null
  psnaccountid: string | null
  xboxxuid: string | null
  preferences: Record<string, unknown> | null
}

type Plan = { source: GameSource; account: string; list: () => Promise<Candidate[]> }

const sum = (c: TrophyCounts) => c.bronze + c.silver + c.gold + c.platinum

function raPlan(username: string, apiKey: string): Plan {
  type Progress = { GameID: number; Title: string; ConsoleName: string; MaxPossible: number; NumAwarded: number; NumAwardedHardcore: number; MostRecentAwardedDate?: string | null }
  return {
    source: 'ra',
    account: username,
    list: async () => {
      const games: Progress[] = []
      for (let offset = 0; ; offset += RA_PAGE) {
        const page = (await getUserCompletionProgress(username, apiKey, offset, RA_PAGE)) as { Total?: number; Results?: Progress[] } | null
        const results = page?.Results ?? []
        games.push(...results)
        if (results.length < RA_PAGE || games.length >= (page?.Total ?? 0)) break
      }
      return games
        .filter((g) => g.NumAwarded > 0 && g.MaxPossible > 0)
        .map((g) => ({
          id: g.GameID,
          title: g.Title,
          console: g.ConsoleName ?? '',
          changeKey: g.MostRecentAwardedDate ?? '',
          provisional: provisionalScore(
            (g.NumAwardedHardcore + (g.NumAwarded - g.NumAwardedHardcore) * 0.5) / g.MaxPossible,
            g.NumAwarded,
            g.MaxPossible,
            g.NumAwardedHardcore >= g.MaxPossible,
          ),
          // Straight from RA, not the page's ten-minute cache: that copy may predate the unlock that moved the game.
          read: async () => {
            const data = (await getGameInfoAndUserProgress(username, apiKey, g.GameID)) as {
              Achievements?: Parameters<typeof raScoreInputs>[0]
              NumDistinctPlayers?: number
            } | null
            const players = data?.NumDistinctPlayers ?? 0
            return { score: scoreGame(raScoreInputs(data?.Achievements ?? {}, players), players), suspect: false }
          },
        }))
    },
  }
}

function steamPlan(userId: number, steamid: string, apiKey: string): Plan {
  const auth = { id: String(userId), steamid, apiKey }
  return {
    source: 'steam',
    account: steamid,
    list: async () => {
      const data = await withSteamCache<SteamOwnedGamesResponse>(
        `score:steamOwned:${steamid}`,
        STEAM_OWNED_TTL_MS,
        async () => (await getOwnedGames(steamid, apiKey)) as SteamOwnedGamesResponse,
        { userId: String(userId) },
      )
      // A private library reads as no games: keep what was scored while it was public.
      if (!data?.response?.games) throw new Error('steam library unreadable')
      return data.response.games
        .filter((g) => g.has_community_visible_stats !== false && g.playtime_forever > 0)
        .map((g) => ({
          id: g.appid,
          title: g.name ?? String(g.appid),
          console: '',
          changeKey: g.rtime_last_played ? new Date(g.rtime_last_played * 1000).toISOString() : '',
          provisional: null,
          read: async () => {
            const [unlocks, pct] = await Promise.all([fetchPlayerAchievements(auth, g.appid), loadGlobalPct(g.appid)])
            const list = isNoStats(unlocks) ? [] : steamScoreInputs(unlocks, pct)
            return { score: scoreGame(list), suspect: looksUnlockedByTool(list) }
          },
        }))
    },
  }
}

function psnPlan(userId: number, accountId: string): Plan {
  return {
    source: 'psn',
    account: accountId,
    list: async () =>
      (await psnTitles(accountId, String(userId)))
        .filter((g) => sum(g.earned) > 0)
        .map((g) => ({
          id: g.id,
          title: g.title,
          console: g.consoleName,
          changeKey: g.lastTrophyAt ?? '',
          provisional: provisionalScore(psnGradeShare(g.earned, g.defined), sum(g.earned), sum(g.defined), sum(g.earned) >= sum(g.defined)),
          // Cached by the date of the last trophy, so a moved game is always read anew.
          read: async () => ({ score: scoreGame(psnScoreInputs(await psnGameTrophies(accountId, g, String(userId)))), suspect: false }),
        })),
  }
}

function xboxPlan(userId: number, xuid: string): Plan {
  return {
    source: 'xbox',
    account: xuid,
    list: async () =>
      (await xboxLibrary(xuid, String(userId)))
        .filter((g) => g.earnedGamerscore > 0 || g.numAwarded > 0)
        .map((g) => ({
          id: g.id,
          title: g.title,
          console: g.consoleName,
          changeKey: g.lastPlayed ?? '',
          provisional: provisionalScore(
            g.totalGamerscore > 0 ? g.earnedGamerscore / g.totalGamerscore : 0,
            g.numAwarded,
            g.maxPossible,
            g.totalGamerscore > 0 && g.earnedGamerscore >= g.totalGamerscore,
          ),
          read: async () => ({ score: scoreGame(xboxScoreInputs(await xboxGameAchievements(xuid, g, String(userId)))), suspect: false }),
        })),
  }
}

function plansFor(user: UserRow): Plan[] {
  const plans: Plan[] = []
  if (user.rausername && user.raid) plans.push(raPlan(user.rausername, user.raid))
  const steamKey = process.env.STEAM_API_KEY?.trim()
  if (user.steamid && steamKey) plans.push(steamPlan(user.id, user.steamid, steamKey))
  if (user.psnaccountid) plans.push(psnPlan(user.id, user.psnaccountid))
  // Only admins can link Xbox while it is admin-only, so no other account has one.
  if (user.xboxxuid) plans.push(xboxPlan(user.id, user.xboxxuid))
  return plans
}

type Write = { game_id: number; title: string; points: number; earned: number; total: number; completed: boolean; provisional: boolean; flag: string | null; change_key: string; unlocks: ScoreUnlock[] }

function toWrite(c: Candidate, score: GameScore, provisional: boolean, flag: string | null): Write {
  return { game_id: c.id, title: c.title, points: score.points, earned: score.earned, total: score.total, completed: score.completed, provisional, flag, change_key: c.changeKey, unlocks: score.unlocks }
}

/** One platform: read what moved, store it, drop what left, and settle the stack factors. Whether everything got read. */
async function refreshSource(userId: number, plan: Plan, hiddenGames: Set<string>, user: UserRow, deadline: number): Promise<boolean> {
  let candidates: Candidate[]
  try {
    candidates = await plan.list()
  } catch (err) {
    console.error(`[scoreRefresh] ${plan.source} list`, userId, err)
    return false
  }

  const hiddenConsoles = hiddenConsolesFrom(user.preferences, plan.source)
  const eligible = candidates
    .filter((c) => !hiddenGames.has(`${plan.source}:${c.id}`) && isConsoleShown(c.console, hiddenConsoles))
    .sort((a, b) => b.changeKey.localeCompare(a.changeKey))

  const rows = await queryRows<StoredRow>(
    `SELECT game_id, account, title, points, change_key, rules_version, provisional, flag FROM score_games WHERE user_id = $1 AND source = $2`,
    [userId, plan.source],
  )
  const stored = new Map(rows.map((r) => [Number(r.game_id), r]))

  const writes: Write[] = []
  let reads = 0
  let complete = true
  for (const c of eligible) {
    const row = stored.get(c.id)
    const same = row !== undefined && row.account === plan.account
    if (same && row.change_key === c.changeKey && row.rules_version === RULES_VERSION && !row.provisional) continue

    if (reads < READS[plan.source] && Date.now() < deadline) {
      reads++
      try {
        const { score, suspect } = await c.read()
        // An admin's "cleared" stands; otherwise a tool's mark flags the game.
        const flag = same && row.flag === 'cleared' ? 'cleared' : suspect ? 'suspect' : null
        writes.push(toWrite(c, score, false, flag))
        continue
      } catch (err) {
        console.error(`[scoreRefresh] ${plan.source} game`, userId, c.id, err)
      }
    }
    complete = false
    // Not read this time: keep a real score that is merely out of date; otherwise stand in from the list.
    if (c.provisional && (!same || row.provisional)) writes.push(toWrite(c, c.provisional, true, same ? row.flag : null))
  }

  if (writes.length > 0) {
    await pool.query(
      `INSERT INTO score_games (user_id, source, game_id, account, title, points, earned, total, completed, provisional, flag, change_key, unlocks, rules_version, updated_at)
       SELECT $1, $2, w.game_id, $3, w.title, w.points, w.earned, w.total, w.completed, w.provisional, w.flag, w.change_key, w.unlocks, $4, now()
       FROM jsonb_to_recordset($5::jsonb) AS w(game_id bigint, title text, points int, earned int, total int, completed boolean, provisional boolean, flag text, change_key text, unlocks jsonb)
       ON CONFLICT (user_id, source, game_id) DO UPDATE SET
         account = EXCLUDED.account, title = EXCLUDED.title, points = EXCLUDED.points, earned = EXCLUDED.earned, total = EXCLUDED.total,
         completed = EXCLUDED.completed, provisional = EXCLUDED.provisional, flag = EXCLUDED.flag, change_key = EXCLUDED.change_key,
         unlocks = EXCLUDED.unlocks, rules_version = EXCLUDED.rules_version, updated_at = now()`,
      [userId, plan.source, plan.account, RULES_VERSION, JSON.stringify(writes)],
    )
  }

  // Games that left the library, were hidden, or belong to an account no longer linked.
  const keep = eligible.filter((c) => writes.some((w) => w.game_id === c.id) || stored.get(c.id)?.account === plan.account).map((c) => c.id)
  await pool.query(`DELETE FROM score_games WHERE user_id = $1 AND source = $2 AND NOT (game_id = ANY($3::bigint[]))`, [userId, plan.source, keep])

  // The same title listed again on this platform counts less (see stackFactors).
  const kept = await queryRows<{ game_id: string; title: string; points: number }>(
    `SELECT game_id, title, points FROM score_games WHERE user_id = $1 AND source = $2`,
    [userId, plan.source],
  )
  const factors = stackFactors(kept.map((r) => ({ key: stackKey(r.title), points: r.points })))
  const changed = kept.map((r, i) => ({ game_id: Number(r.game_id), f: factors[i] }))
  await pool.query(
    `UPDATE score_games g SET stack_factor = v.f
     FROM jsonb_to_recordset($3::jsonb) AS v(game_id bigint, f real)
     WHERE g.user_id = $1 AND g.source = $2 AND g.game_id = v.game_id AND g.stack_factor <> v.f`,
    [userId, plan.source, JSON.stringify(changed)],
  )
  return complete
}

/** Weeks and months, per platform, rebuilt from the stored games. */
export async function rebuildPeriods(userId: number): Promise<void> {
  const rows = await queryRows<{ source: string; unlocks: ScoreUnlock[]; stack_factor: number }>(
    `SELECT source, unlocks, stack_factor FROM score_games WHERE user_id = $1 AND flag IS DISTINCT FROM 'suspect'`,
    [userId],
  )
  const totals = new Map<string, { source: string; kind: 'w' | 'm'; start: string; points: number }>()
  const add = (source: string, kind: 'w' | 'm', start: string, points: number) => {
    const key = `${source}|${kind}|${start}`
    const entry = totals.get(key) ?? { source, kind, start, points: 0 }
    entry.points += points
    totals.set(key, entry)
  }
  for (const r of rows) {
    for (const [t, p] of r.unlocks ?? []) {
      if (!t || !p) continue
      const date = new Date(t * 1000)
      add(r.source, 'w', weekStart(date), p * r.stack_factor)
      add(r.source, 'm', monthStart(date), p * r.stack_factor)
    }
  }
  const list = [...totals.values()].map((e) => ({ ...e, points: Math.round(e.points) })).filter((e) => e.points > 0)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM score_periods WHERE user_id = $1', [userId])
    if (list.length > 0) {
      await client.query(
        `INSERT INTO score_periods (user_id, source, kind, start, points)
         SELECT $1, p.source, p.kind, p.start, p.points FROM jsonb_to_recordset($2::jsonb) AS p(source text, kind text, start date, points int)`,
        [userId, JSON.stringify(list)],
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/** Refreshes one user's score until `deadline`. Whether every game got read. */
export async function refreshScore(userId: number, deadline: number): Promise<boolean> {
  try {
    const rows = await queryRows<UserRow>(
      `SELECT id, rausername, raid, steamid, psnaccountid, xboxxuid, preferences FROM users WHERE id = $1`,
      [userId],
    )
    const user = rows[0]
    if (!user) return true

    const plans = plansFor(user)
    // A platform unlinked takes its games with it.
    await pool.query(`DELETE FROM score_games WHERE user_id = $1 AND NOT (source = ANY($2::text[]))`, [userId, plans.map((p) => p.source)])

    const hidden = await queryRows<{ source: string; game_id: number }>('SELECT source, game_id FROM hidden_games WHERE user_id = $1', [userId])
    const hiddenGames = new Set(hidden.map((h) => `${h.source}:${h.game_id}`))

    const done = await Promise.all(plans.map((p) => refreshSource(userId, p, hiddenGames, user, deadline).catch((err) => {
      console.error(`[scoreRefresh] ${p.source}`, userId, err)
      return false
    })))
    await rebuildPeriods(userId)
    return done.every(Boolean)
  } catch (err) {
    console.error('[scoreRefresh]', userId, err)
    return false
  }
}

/** Refreshes and records when; an unfinished fill is asked to come back in minutes rather than hours. */
async function refreshAndMark(userId: number, budgetMs: number): Promise<void> {
  const complete = await refreshScore(userId, Date.now() + budgetMs)
  if (!complete) {
    await pool
      .query(`UPDATE users SET score_refreshed_at = now() - make_interval(hours => $2) + make_interval(mins => $3) WHERE id = $1`, [userId, FRESH_HOURS, RETRY_MINUTES])
      .catch((err: unknown) => console.error('[scoreRefresh] mark', userId, err))
  }
}

/**
 * The user is on the site (the presence heartbeat): refresh when the score is
 * older than FRESH_HOURS. The row is claimed first, so two tabs or instances
 * never refresh the same user at once.
 */
export async function refreshScoreIfStale(userId: string | number, budgetMs = 25_000): Promise<void> {
  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET score_refreshed_at = now()
       WHERE id = $1 AND (score_refreshed_at IS NULL OR score_refreshed_at < now() - make_interval(hours => $2))`,
      [userId, FRESH_HOURS],
    )
    if (!rowCount) return
    await refreshAndMark(Number(userId), budgetMs)
  } catch (err) {
    console.error('[scoreRefresh] stale check', userId, err)
  }
}

/**
 * The daily pass: users never scored first, then those seen in the last two
 * weeks whose score is a day old, until `deadline`. How many were refreshed.
 */
export async function refreshDueScores(deadline: number): Promise<number> {
  let count = 0
  while (Date.now() < deadline - 5_000) {
    const rows = await queryRows<{ id: number }>(
      `UPDATE users SET score_refreshed_at = now()
       WHERE id = (
         SELECT id FROM users
         WHERE (rausername IS NOT NULL OR steamid IS NOT NULL OR psnaccountid IS NOT NULL OR xboxxuid IS NOT NULL)
           AND (score_refreshed_at IS NULL
                OR (score_refreshed_at < now() - interval '20 hours' AND last_seen_at > now() - interval '14 days'))
         ORDER BY score_refreshed_at NULLS FIRST
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING id`,
    )
    if (!rows[0]) break
    await refreshAndMark(rows[0].id, Math.min(25_000, deadline - Date.now() - 2_000))
    count++
  }
  return count
}
