import { after } from 'next/server'
import pool from '@/lib/db'
import { queryRows } from '@/lib/queryRows'
import { allowAttempt } from '@/lib/attemptLimit'
import { getGameInfoAndUserProgress, getUserCompletionProgress } from '@/lib/raClient'
import { getOwnedGames } from '@/lib/steamClient'
import { readCache, withSteamCache, writeCache } from '@/lib/steamCache'
import { fetchPlayerAchievements, isNoStats, loadGlobalPct } from '@/lib/steamProgress'
import { PsnError, psnGameTrophies, psnTitles } from '@/lib/psnClient'
import { XboxError, xboxGameAchievements, xboxLibrary } from '@/lib/xboxClient'
import { runWithXboxTelemetry } from '@/lib/xboxTelemetry'
import type { GameSource, SteamOwnedGamesResponse } from '@/types/steam'
import type { TrophyCounts } from '@/types/psn'
import { isConsoleShown } from '@/utils/consoleFilter'
import { RULES_VERSION, looksUnlockedByTool, provisionalScore, scoreGame, stackFactors, stackKey, type GameScore, type ScoreUnlock } from '@/utils/vaultScore'
import { hiddenConsolesFrom, psnGradeShare, psnScoreInputs, raScoreInputs, steamScoreInputs, xboxScoreInputs } from '@/utils/vaultScoreInputs'
import { monthStart, weekStart } from '@/utils/vaultLevel'

/**
 * Keeps a user's Vault Points up to date (docs/rankings-plan.md). Each
 * platform's library is listed once; only games whose last unlock moved since
 * they were scored are read again, newest first, at the pace each platform
 * stands (measured 2026-10-20, see PACE). A game not read yet scores
 * provisionally from its progress in the list, so nobody sees a zero while
 * their library fills in. How far the fill has got is kept (FillStatus) for
 * the screens that show it. Nothing here throws to the caller.
 */

/** How long a complete score counts as fresh. */
const FRESH_HOURS = 6
/** A pass holds the user's row this long; a second pass cannot start meanwhile. */
const CLAIM_SECONDS = 120
/** An unfinished fill that nobody continues is picked up by the heartbeat this soon. */
const RESUME_MINUTES = 15

/**
 * How each platform is read, from what was measured: Steam took 8 at once with
 * no error (29 games/s); RA allows a burst of ~7, then 429s with no Retry-After,
 * and never failed one call every 250 ms; PSN read 4 at once without trouble,
 * but it is one app account for everyone, so it goes gently (2 at once, 100 a
 * pass, and PSN_BUDGET across the whole app); Xbox shares 150 calls an hour.
 */
export const PACE: Record<GameSource, { concurrency: number; gapMs: number; perPass: number }> = {
  steam: { concurrency: 8, gapMs: 0, perPass: Infinity },
  ra: { concurrency: 1, gapMs: 300, perPass: Infinity },
  psn: { concurrency: 2, gapMs: 0, perPass: 100 },
  xbox: { concurrency: 1, gapMs: 0, perPass: 2 },
}

const RA_PAGE = 500
const STEAM_OWNED_TTL_MS = 60 * 60 * 1000
const FILL_TTL_MS = 24 * 60 * 60 * 1000

/** Where a platform's fill stands. 'estimated': only Xbox, scored from gamerscore until read. */
export type FillState = 'reading' | 'done' | 'estimated' | 'error'
/** private: the profile hides it; key: RA refused the key; busy: the platform asked us to slow down. */
export type FillError = 'private' | 'key' | 'unavailable' | 'busy'
export type FillPlatform = {
  read: number
  total: number
  state: FillState
  error?: FillError
  /**
   * Games the platform would not answer for (Steam gives a 500 for some games with no
   * achievements, measured 2026-10-20). They do not hold the fill up; the next refresh tries again.
   */
  skipped?: number
}
export type FillStatus = {
  /** Every platform read, or settled (estimated, or failed for a reason waiting will not fix). */
  complete: boolean
  running: boolean
  /** All-time total once the last pass ended. */
  points: number
  updatedAt: string
  platforms: Partial<Record<GameSource, FillPlatform>>
}

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

/** A Steam library that reads as no games at all: the profile or its game details are private. */
class SteamLibraryPrivate extends Error {}

const sum = (c: TrophyCounts) => c.bronze + c.silver + c.gold + c.platinum
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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
        // A private library is not cached: making it public takes effect on the next pass.
        { userId: String(userId), shouldCache: (d) => Boolean(d?.response?.games) },
      )
      // A private library reads as no games: keep what was scored while it was public.
      if (!data?.response?.games) throw new SteamLibraryPrivate('steam library unreadable')
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

/** Why a platform could not be read, in terms the user can act on (or wait out). */
export function classifyFailure(source: GameSource, err: unknown): FillError {
  if (err instanceof SteamLibraryPrivate) return 'private'
  if (err instanceof PsnError) return err.isPrivate ? 'private' : err.isRateLimited ? 'busy' : 'unavailable'
  if (source === 'xbox' && err instanceof XboxError && err.kind === 'rate-limited') return 'busy'
  const status = (err as { status?: number } | null)?.status
  if (status === 429) return 'busy'
  if (source === 'ra' && (status === 401 || status === 403)) return 'key'
  return 'unavailable'
}

type Write = { game_id: number; title: string; points: number; earned: number; total: number; completed: boolean; provisional: boolean; flag: string | null; change_key: string; unlocks: ScoreUnlock[] }

function toWrite(c: Candidate, score: GameScore, provisional: boolean, flag: string | null): Write {
  return { game_id: c.id, title: c.title, points: score.points, earned: score.earned, total: score.total, completed: score.completed, provisional, flag, change_key: c.changeKey, unlocks: score.unlocks }
}

/**
 * One platform: read what moved (at the platform's pace), store it, drop what
 * left, settle the stack factors. Tells `report` how far it has got as it goes.
 */
async function refreshSource(
  userId: number,
  plan: Plan,
  hiddenGames: Set<string>,
  user: UserRow,
  deadline: number,
  report: (p: FillPlatform) => void,
): Promise<FillPlatform> {
  let candidates: Candidate[]
  try {
    candidates = await plan.list()
  } catch (err) {
    console.error(`[scoreRefresh] ${plan.source} list`, userId, err)
    const error = classifyFailure(plan.source, err)
    // Busy is waited out (the fill goes on); the rest need the user, or a later pass.
    return { read: 0, total: 0, state: error === 'busy' ? 'reading' : 'error', error }
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
  const isCurrent = (c: Candidate) => {
    const row = stored.get(c.id)
    return row !== undefined && row.account === plan.account && row.change_key === c.changeKey && row.rules_version === RULES_VERSION && !row.provisional
  }
  const todo = eligible.filter((c) => !isCurrent(c))
  const progress: FillPlatform = { read: eligible.length - todo.length, total: eligible.length, state: todo.length ? 'reading' : 'done' }
  report({ ...progress })

  // Read at the platform's pace: a few workers, a gap between calls, a cap per pass.
  const pace = PACE[plan.source]
  const read = new Map<number, Write>()
  let next = 0
  let skipped = 0
  let stopped = null as FillError | null
  const worker = async () => {
    while (next < todo.length && next < pace.perPass && !stopped && Date.now() < deadline) {
      const c = todo[next++]
      // PSN is one app account for everyone: a brake across the whole app, counted in the database.
      if (plan.source === 'psn' && !(await allowAttempt('psn-score', 'app'))) {
        stopped = 'busy'
        return
      }
      try {
        const { score, suspect } = await c.read()
        const row = stored.get(c.id)
        // An admin's "cleared" stands; otherwise a tool's mark flags the game.
        const flag = row?.account === plan.account && row.flag === 'cleared' ? 'cleared' : suspect ? 'suspect' : null
        read.set(c.id, toWrite(c, score, false, flag))
        progress.read++
        report({ ...progress })
      } catch (err) {
        console.error(`[scoreRefresh] ${plan.source} game`, userId, c.id, err)
        // Asked to slow down: stop this platform for this pass rather than insist. Anything
        // else is this game alone: skip it, so one game cannot hold the whole fill up.
        if (classifyFailure(plan.source, err) === 'busy') stopped = 'busy'
        else {
          skipped++
          progress.skipped = skipped
          report({ ...progress })
        }
      }
      if (pace.gapMs) await sleep(pace.gapMs)
    }
  }
  await Promise.all(Array.from({ length: Math.min(pace.concurrency, Math.max(1, todo.length)) }, worker))

  const writes: Write[] = [...read.values()]
  for (const c of todo) {
    if (read.has(c.id)) continue
    const row = stored.get(c.id)
    const same = row !== undefined && row.account === plan.account
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
  await pool.query(
    `UPDATE score_games g SET stack_factor = v.f
     FROM jsonb_to_recordset($3::jsonb) AS v(game_id bigint, f real)
     WHERE g.user_id = $1 AND g.source = $2 AND g.game_id = v.game_id AND g.stack_factor <> v.f`,
    [userId, plan.source, JSON.stringify(kept.map((r, i) => ({ game_id: Number(r.game_id), f: factors[i] })))],
  )

  // Every read failed: the platform is down, not a few odd games. Say so rather than call it done.
  const readNow = read.size
  if (skipped >= 4 && readNow === 0) return { ...progress, state: 'error', error: 'unavailable' }
  const done = progress.read + skipped >= progress.total
  if (done) return { ...progress, state: 'done' }
  // Xbox's 150 calls an hour for the whole app: its gamerscore estimate is the settled state.
  if (plan.source === 'xbox' && !stopped) return { ...progress, state: 'estimated' }
  return { ...progress, state: 'reading', ...(stopped ? { error: stopped } : {}) }
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

/** Every platform read or settled; 'busy' and plain 'reading' are not. */
export function fillComplete(platforms: FillStatus['platforms']): boolean {
  return Object.values(platforms).every((p) => p && (p.state === 'done' || p.state === 'estimated' || p.state === 'error'))
}

/**
 * Refreshes one user's score until `deadline`, telling `report` how each
 * platform is getting on. The platforms as they ended, and whether all are settled.
 */
async function refreshScoreNow(
  userId: number,
  deadline: number,
  report: (source: GameSource, p: FillPlatform) => void,
): Promise<{ complete: boolean; platforms: FillStatus['platforms'] }> {
  try {
    const rows = await queryRows<UserRow>(
      `SELECT id, rausername, raid, steamid, psnaccountid, xboxxuid, preferences FROM users WHERE id = $1`,
      [userId],
    )
    const user = rows[0]
    if (!user) return { complete: true, platforms: {} }

    const plans = plansFor(user)
    // A platform unlinked takes its games with it.
    await pool.query(`DELETE FROM score_games WHERE user_id = $1 AND NOT (source = ANY($2::text[]))`, [userId, plans.map((p) => p.source)])

    const hidden = await queryRows<{ source: string; game_id: number }>('SELECT source, game_id FROM hidden_games WHERE user_id = $1', [userId])
    const hiddenGames = new Set(hidden.map((h) => `${h.source}:${h.game_id}`))

    const ended = await Promise.all(
      plans.map((p) =>
        refreshSource(userId, p, hiddenGames, user, deadline, (progress) => report(p.source, progress)).catch((err): FillPlatform => {
          console.error(`[scoreRefresh] ${p.source}`, userId, err)
          return { read: 0, total: 0, state: 'reading', error: 'unavailable' }
        }),
      ),
    )
    await rebuildPeriods(userId)
    const platforms = Object.fromEntries(plans.map((p, i) => [p.source, ended[i]])) as FillStatus['platforms']
    return { complete: fillComplete(platforms), platforms }
  } catch (err) {
    console.error('[scoreRefresh]', userId, err)
    return { complete: false, platforms: {} }
  }
}

export async function refreshScore(
  userId: number,
  deadline: number,
  report: (source: GameSource, p: FillPlatform) => void = () => {},
): Promise<{ complete: boolean; platforms: FillStatus['platforms'] }> {
  return runWithXboxTelemetry('scoreRefresh', () => refreshScoreNow(userId, deadline, report))
}

const fillKey = (userId: number) => `score:fill:${userId}`

/** Where the user's fill stands, as the last pass left it; null before the first. */
export async function readFillStatus(userId: number): Promise<FillStatus | null> {
  try {
    return await readCache<FillStatus>(fillKey(userId))
  } catch (err) {
    console.error('[scoreRefresh] read fill', userId, err)
    return null
  }
}

async function saveFillStatus(userId: number, status: FillStatus): Promise<void> {
  try {
    await writeCache(fillKey(userId), status, FILL_TTL_MS, String(userId))
  } catch (err) {
    console.error('[scoreRefresh] save fill', userId, err)
  }
}

async function totalPoints(userId: number): Promise<number> {
  const rows = await queryRows<{ points: number | null }>(
    `SELECT SUM(points * stack_factor)::float AS points FROM score_games WHERE user_id = $1 AND flag IS DISTINCT FROM 'suspect'`,
    [userId],
  )
  return Math.round(rows[0]?.points ?? 0)
}

/**
 * Marks a platform as about to be read (just linked), so the screens say
 * "calculating" at once and the next pass is not skipped as already complete.
 */
export async function markFillPending(userId: number, source: GameSource): Promise<void> {
  const prev = await readFillStatus(userId)
  await saveFillStatus(userId, {
    complete: false,
    running: prev?.running ?? false,
    points: prev?.points ?? 0,
    updatedAt: new Date().toISOString(),
    platforms: { ...(prev?.platforms ?? {}), [source]: { read: 0, total: 0, state: 'reading' } },
  })
}

/** Takes the user's row for a pass: only one at a time, whoever asks (heartbeat, fill, link, cron). */
async function claim(userId: number, olderThan: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE users SET score_refreshed_at = now()
     WHERE id = $1 AND (score_refreshed_at IS NULL OR score_refreshed_at < now() - $2::interval)`,
    [userId, olderThan],
  )
  return Boolean(rowCount)
}

/**
 * One pass for a user already claimed, saving its progress as it goes (at
 * most every 1.5 s). A finished pass marks the score fresh; an unfinished one
 * leaves the row free for the next pass at once, or for the heartbeat later.
 */
export async function runScorePass(userId: number, budgetMs: number): Promise<FillStatus> {
  const prev = await readFillStatus(userId)
  const status: FillStatus = { complete: false, running: true, points: prev?.points ?? 0, updatedAt: new Date().toISOString(), platforms: { ...(prev?.platforms ?? {}) } }
  let lastSave = 0
  let saving: Promise<void> = Promise.resolve()
  const save = (force = false) => {
    if (!force && Date.now() - lastSave < 1_500) return saving
    lastSave = Date.now()
    status.updatedAt = new Date().toISOString()
    saving = saving.then(() => saveFillStatus(userId, { ...status, platforms: { ...status.platforms } }))
    return saving
  }
  await save(true)

  const result = await refreshScore(userId, Date.now() + budgetMs, (source, p) => {
    status.platforms[source] = p
    void save()
  })
  status.platforms = result.platforms
  status.complete = result.complete
  status.running = false
  status.points = await totalPoints(userId).catch(() => status.points)
  await save(true)

  await pool
    .query(
      status.complete
        ? `UPDATE users SET score_refreshed_at = now() WHERE id = $1`
        : `UPDATE users SET score_refreshed_at = now() - make_interval(hours => $2) + make_interval(mins => $3) WHERE id = $1`,
      status.complete ? [userId] : [userId, FRESH_HOURS, RESUME_MINUTES],
    )
    .catch((err: unknown) => console.error('[scoreRefresh] mark', userId, err))
  return status
}

/**
 * The fill the screens drive (POST /api/rankings/fill): a pass when the score
 * is unfinished or stale and no other pass is running; otherwise where it stands.
 */
export type FillAnswer = FillStatus & {
  /** A pass ran for this answer (so there may be new points to show). */
  ran: boolean
  /** That pass finished a fill that was pending: the moment to say "your points are ready". */
  finished: boolean
}

export async function continueFill(userId: number, budgetMs: number): Promise<FillAnswer | null> {
  const status = await readFillStatus(userId)
  const fresh = status?.complete && Date.now() - Date.parse(status.updatedAt) < FRESH_HOURS * 3_600_000
  if (status && fresh) return { ...status, ran: false, finished: false }
  if (!(await claim(userId, `${CLAIM_SECONDS} seconds`))) return status && { ...status, ran: false, finished: false }
  const ended = await runScorePass(userId, budgetMs)
  return { ...ended, ran: true, finished: ended.complete && !status?.complete }
}

/** Right after a platform is linked: one pass at once, if none is running. */
export async function startFill(userId: number, budgetMs = 60_000): Promise<void> {
  try {
    if (await claim(userId, `${CLAIM_SECONDS} seconds`)) await runScorePass(userId, budgetMs)
  } catch (err) {
    console.error('[scoreRefresh] start fill', userId, err)
  }
}

/**
 * A platform was just linked: the screens say "calculating" at once (before
 * the answer), and a pass runs right after it, so the new account's points
 * land in seconds rather than at the next heartbeat.
 */
export async function onPlatformLinked(userId: number, source: GameSource): Promise<void> {
  await markFillPending(userId, source)
  after(() => startFill(userId))
}

/**
 * The user is on the site (the presence heartbeat): refresh when the score is
 * older than FRESH_HOURS (or an unfinished fill was left behind).
 */
export async function refreshScoreIfStale(userId: string | number, budgetMs = 25_000): Promise<void> {
  try {
    if (await claim(Number(userId), `${FRESH_HOURS} hours`)) await runScorePass(Number(userId), budgetMs)
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
    await runScorePass(rows[0].id, Math.min(25_000, deadline - Date.now() - 2_000))
    count++
  }
  return count
}
