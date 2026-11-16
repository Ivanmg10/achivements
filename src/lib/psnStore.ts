import pool from '@/lib/db'
import { queryRows } from '@/lib/queryRows'
import type { IgdbArt } from '@/lib/igdbClient'
import type { PsnGameProgress, PsnRecentTrophy, PsnTrophy, PsnTrophyGroup, TrophyCounts, TrophyGrade } from '@/types/psn'
import { toGroups } from '@/utils/psnTitles'

/**
 * The PSN snapshots in Postgres (#179, migrations/048): every SQL statement on psn_players, psn_player_games,
 * psn_player_trophies, psn_games and psn_trophies. The worker writes them (psnSync), the pages read them
 * (psnSnapshot); nothing here calls Sony. Tests swap this module for `test-utils/memoryPsnStore`.
 */

/** A player's games past this many are not kept (the largest libraries seen are under 3,000). */
export const MAX_GAMES = 5000
const FALLBACK_LANGUAGE = 'en-US'

/** The headline numbers as Sony gives them; the game count and the sync dates are added on reading. */
export type PsnSummaryCore = {
  onlineId: string
  avatarUrl: string | null
  aboutMe: string
  isPlus: boolean
  trophyLevel: number
  tier: number
  levelProgress: number
  earned: TrophyCounts
}

/** One game the account has played, from Sony's played-games list (PS4/PS5 only). */
export type PlayedGame = {
  titleId: string
  name: string
  lastPlayed: string | null
  playtimeMinutes: number | null
  playCount: number
  iconUrl: string | null
  coverUrl: string | null
  heroUrl: string | null
  conceptId: number | null
}

/** What the background adds to the trophy list: play data, the trophy sets of the played games, IGDB art. */
export type Enrichment = { played: PlayedGame[]; sets: Record<string, string[]>; art: Record<string, IgdbArt> }

export type PsnPlayer = {
  accountId: string
  summary: PsnSummaryCore | null
  summaryAt: number | null
  profileAt: number | null
  titlesAt: number | null
  enrichment: Enrichment | null
  enrichedAt: number | null
  /** When the year of trophies was first complete; null until then (the year answers 202). */
  yearAt: number | null
  language: string
  state: 'new' | 'ok' | 'private'
  /** How many games its trophy list has. */
  games: number
}

export type StoredGame = {
  game: PsnGameProgress
  /** The `lastTrophyAt` the stored trophies belong to; null when they were never read. */
  trophiesAt: string | null
  completedAt: string | null
}

/** What the store already has of a game's set: the languages of its texts and its groups', and its trophies' grade and group. */
export type KnownSet = { languages: string[]; groupLanguages: string[]; known: Array<Pick<PsnTrophy, 'id' | 'type' | 'groupId'>> }

/** A game the next sync must read, with what is already known of its set. */
export type DeltaGame = StoredGame & KnownSet

export type TrophyDef = Pick<PsnTrophy, 'id' | 'name' | 'detail' | 'iconUrl' | 'type' | 'groupId' | 'hidden'>
export type GroupDef = Pick<PsnTrophyGroup, 'id' | 'name' | 'iconUrl' | 'defined'>
export type GroupEarned = { id: string; earned: TrophyCounts; progress: number }

/** One game's trophies as read from Sony: what to store. `defined` and `groupDefs` only when they were read. */
export type GameSnapshot = {
  titleId: string
  lastTrophyAt: string | null
  language: string
  defined: TrophyDef[] | null
  earned: Array<{ id: number; earnedAt: string | null }>
  rarity: Array<{ id: number; rarity: number | null }>
  groupDefs: GroupDef[] | null
  groupsEarned: GroupEarned[] | null
  completedAt: string | null
}

const ms = (d: Date | string | null) => (d ? new Date(d).getTime() : null)

type PlayerRow = {
  account_id: string
  summary: PsnSummaryCore | null
  summary_at: Date | null
  profile_at: Date | null
  titles_at: Date | null
  enrichment: Enrichment | null
  enriched_at: Date | null
  year_at: Date | null
  language: string
  state: PsnPlayer['state']
  games: number
}

export async function loadPsnPlayer(accountId: string): Promise<PsnPlayer | null> {
  const [row] = await queryRows<PlayerRow>(
    `SELECT p.*, (SELECT count(*) FROM psn_player_games g WHERE g.account_id = p.account_id)::int AS games FROM psn_players p WHERE p.account_id = $1`,
    [accountId],
  )
  if (!row) return null
  return {
    accountId: row.account_id,
    summary: row.summary,
    summaryAt: ms(row.summary_at),
    profileAt: ms(row.profile_at),
    titlesAt: ms(row.titles_at),
    enrichment: row.enrichment,
    enrichedAt: ms(row.enriched_at),
    yearAt: ms(row.year_at),
    language: row.language,
    state: row.state,
    games: row.games,
  }
}

/** The headline numbers; `withProfile` when the profile (online ID, avatar, About Me) was read too. */
export async function savePsnSummary(accountId: string, summary: PsnSummaryCore, withProfile: boolean): Promise<void> {
  await pool.query(
    `INSERT INTO psn_players (account_id, summary, summary_at, profile_at, state) VALUES ($1, $2, now(), CASE WHEN $3 THEN now() END, 'ok')
     ON CONFLICT (account_id) DO UPDATE SET summary = EXCLUDED.summary, summary_at = now(), state = 'ok', updated_at = now(),
       profile_at = CASE WHEN $3 THEN now() ELSE psn_players.profile_at END`,
    [accountId, JSON.stringify(summary), withProfile],
  )
}

/** Sony says the account hides its trophies: pages answer 403 until a sync finds them public again. */
export async function markPsnPrivate(accountId: string): Promise<void> {
  await pool.query(
    `INSERT INTO psn_players (account_id, state) VALUES ($1, 'private')
     ON CONFLICT (account_id) DO UPDATE SET state = 'private', updated_at = now()`,
    [accountId],
  )
}

/** The language trophy texts are read in from now on (the last one a reader asked for). */
export async function setPsnLanguage(accountId: string, language: string): Promise<void> {
  await pool.query('UPDATE psn_players SET language = $2 WHERE account_id = $1 AND language <> $2', [accountId, language])
}

export async function savePsnEnrichment(accountId: string, enrichment: Enrichment): Promise<void> {
  await pool.query('UPDATE psn_players SET enrichment = $2, enriched_at = now() WHERE account_id = $1', [accountId, JSON.stringify(enrichment)])
}

export async function markPsnYearReady(accountId: string): Promise<void> {
  await pool.query('UPDATE psn_players SET year_at = now() WHERE account_id = $1 AND year_at IS NULL', [accountId])
}

/** The account's games, most recent trophy first. */
export async function loadPsnGames(accountId: string): Promise<StoredGame[]> {
  const rows = await queryRows<GameRow>(
    `SELECT game, trophies_at, completed_at FROM psn_player_games WHERE account_id = $1 ORDER BY last_trophy_at DESC NULLS LAST`,
    [accountId],
  )
  return rows.map(toStored)
}

type GameRow = { game: PsnGameProgress; trophies_at: string | null; completed_at: string | null }
const toStored = (r: GameRow): StoredGame => ({ game: r.game, trophiesAt: r.trophies_at, completedAt: r.completed_at })

/** One game of the account's, or null when it is not in their list. */
export async function loadPsnGame(accountId: string, titleId: string): Promise<StoredGame | null> {
  const [row] = await queryRows<GameRow>('SELECT game, trophies_at, completed_at FROM psn_player_games WHERE account_id = $1 AND title_id = $2', [accountId, titleId])
  return row ? toStored(row) : null
}

/** The `count` games with a trophy earned most recently. */
export async function loadPsnLatestGames(accountId: string, count: number): Promise<StoredGame[]> {
  const rows = await queryRows<GameRow>(
    `SELECT game, trophies_at, completed_at FROM psn_player_games
      WHERE account_id = $1 AND (game->>'numAwarded')::int > 0 ORDER BY last_trophy_at DESC NULLS LAST LIMIT $2`,
    [accountId, count],
  )
  return rows.map(toStored)
}

/**
 * The trophy list as Sony gave it: each set's shared row (psn_games), the player's rows, and the games no longer
 * listed dropped (their trophies go with them). The stored trophies stay, so only the games whose last trophy
 * moved are read again.
 */
export async function savePsnTitles(accountId: string, games: PsnGameProgress[]): Promise<void> {
  const kept = games.slice(0, MAX_GAMES)
  const sets = kept.map((g) => ({ title_id: g.titleId, service: g.service, name: g.title, icon_url: g.imageIcon, platform: g.consoleName, defined: g.defined, has_dlc: g.hasDlc }))
  const mine = kept.map((g) => ({ title_id: g.titleId, game: g, last_trophy_at: g.lastTrophyAt }))
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO psn_players (account_id, titles_at, state) VALUES ($1, now(), 'ok')
       ON CONFLICT (account_id) DO UPDATE SET titles_at = now(), state = 'ok', updated_at = now()`,
      [accountId],
    )
    await client.query(
      `INSERT INTO psn_games (title_id, service, name, icon_url, platform, defined, has_dlc)
       SELECT * FROM jsonb_to_recordset($1::jsonb) AS s(title_id text, service text, name text, icon_url text, platform text, defined jsonb, has_dlc boolean)
       ON CONFLICT (title_id) DO UPDATE SET service = EXCLUDED.service, name = EXCLUDED.name, icon_url = EXCLUDED.icon_url,
         platform = EXCLUDED.platform, defined = EXCLUDED.defined, has_dlc = EXCLUDED.has_dlc, updated_at = now()
       WHERE (psn_games.name, psn_games.icon_url, psn_games.defined, psn_games.has_dlc) IS DISTINCT FROM (EXCLUDED.name, EXCLUDED.icon_url, EXCLUDED.defined, EXCLUDED.has_dlc)`,
      [JSON.stringify(sets)],
    )
    await client.query(
      `INSERT INTO psn_player_games (account_id, title_id, game, last_trophy_at)
       SELECT $1, m.title_id, m.game, m.last_trophy_at FROM jsonb_to_recordset($2::jsonb) AS m(title_id text, game jsonb, last_trophy_at text)
       ON CONFLICT (account_id, title_id) DO UPDATE SET game = EXCLUDED.game, last_trophy_at = EXCLUDED.last_trophy_at`,
      [accountId, JSON.stringify(mine)],
    )
    await client.query(`DELETE FROM psn_player_games WHERE account_id = $1 AND NOT (title_id = ANY($2::text[]))`, [accountId, kept.map((g) => g.titleId)])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

const STALE = 'p.trophies_at IS DISTINCT FROM p.last_trophy_at'
/** The year's games to read: moved or asked for, with a trophy since `$2`. */
const DELTA_YEAR = `(${STALE} OR p.wanted_at IS NOT NULL) AND p.last_trophy_at >= $2`
/** The rest: older games that moved, and any game a page asked for (a page waits on it). */
const DELTA_REST = `(p.wanted_at IS NOT NULL OR (${STALE} AND (p.last_trophy_at < $2 OR p.last_trophy_at IS NULL)))`

/**
 * The games whose trophies the next sync must read (the delta): those whose last trophy moved since their trophies
 * were stored, new ones, and those a page asked for (first). `year`: the year's (the `recent` phase), or `rest`
 * (`history`).
 */
export async function psnDeltaGames(accountId: string, since: string, scope: 'year' | 'rest', limit: number): Promise<DeltaGame[]> {
  const rows = await queryRows<{ game: PsnGameProgress; trophies_at: string | null; completed_at: string | null; languages: string[] | null; group_languages: string[] | null; known: KnownSet['known'] | null }>(
    `SELECT p.game, p.trophies_at, p.completed_at, g.languages,
            ARRAY(SELECT jsonb_object_keys(COALESCE(g.groups, '{}'))) AS group_languages,
            (SELECT jsonb_agg(jsonb_build_object('id', t.trophy_id, 'type', t.type, 'groupId', t.group_id))
               FROM psn_trophies t WHERE t.title_id = p.title_id) AS known
       FROM psn_player_games p LEFT JOIN psn_games g ON g.title_id = p.title_id
      WHERE p.account_id = $1
        AND ${scope === 'year' ? DELTA_YEAR : DELTA_REST}
      ORDER BY p.wanted_at IS NULL, p.last_trophy_at DESC NULLS LAST
      LIMIT $3`,
    [accountId, since, limit],
  )
  return rows.map((r) => ({
    game: r.game,
    trophiesAt: r.trophies_at,
    completedAt: r.completed_at,
    languages: r.languages ?? [],
    groupLanguages: r.group_languages ?? [],
    known: r.known ?? [],
  }))
}

/** How many games still wait for their trophies: in the year, and in all. */
export async function psnDeltaCount(accountId: string, since: string): Promise<{ year: number; total: number }> {
  const [row] = await queryRows<{ year: number; total: number }>(
    `SELECT count(*) FILTER (WHERE ${DELTA_YEAR})::int AS year, count(*)::int AS total
       FROM psn_player_games p
      WHERE p.account_id = $1 AND (${STALE} OR p.wanted_at IS NOT NULL)`,
    [accountId, since],
  )
  return row ?? { year: 0, total: 0 }
}

/** A page wants this game's trophies (not read yet, or not in its language): the next sync reads it first. */
export async function markPsnWanted(accountId: string, titleId: string): Promise<void> {
  await pool.query('UPDATE psn_player_games SET wanted_at = now() WHERE account_id = $1 AND title_id = $2 AND wanted_at IS NULL', [accountId, titleId])
}

/** One game's trophies as read: the shared definitions and rarity, and the account's earned ones and groups. */
export async function savePsnGameTrophies(accountId: string, snap: GameSnapshot): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (snap.defined) {
      const defs = snap.defined.map((t) => ({ trophy_id: t.id, type: t.type, group_id: t.groupId, hidden: t.hidden, icon_url: t.iconUrl, texts: { [snap.language]: [t.name, t.detail] } }))
      await client.query(
        `INSERT INTO psn_trophies (title_id, trophy_id, type, group_id, hidden, icon_url, texts)
         SELECT $1, d.trophy_id, d.type, d.group_id, d.hidden, d.icon_url, d.texts
           FROM jsonb_to_recordset($2::jsonb) AS d(trophy_id int, type text, group_id text, hidden boolean, icon_url text, texts jsonb)
         ON CONFLICT (title_id, trophy_id) DO UPDATE SET type = EXCLUDED.type, group_id = EXCLUDED.group_id, hidden = EXCLUDED.hidden,
           icon_url = EXCLUDED.icon_url, texts = psn_trophies.texts || EXCLUDED.texts`,
        [snap.titleId, JSON.stringify(defs)],
      )
      await client.query(
        `UPDATE psn_games SET languages = array_append(array_remove(languages, $2), $2), updated_at = now() WHERE title_id = $1`,
        [snap.titleId, snap.language],
      )
    }
    if (snap.groupDefs) {
      await client.query(`UPDATE psn_games SET groups = groups || jsonb_build_object($2::text, $3::jsonb) WHERE title_id = $1`, [snap.titleId, snap.language, JSON.stringify(snap.groupDefs)])
    }
    await client.query(
      `UPDATE psn_trophies t SET rarity = r.rarity FROM jsonb_to_recordset($2::jsonb) AS r(id int, rarity real)
        WHERE t.title_id = $1 AND t.trophy_id = r.id AND t.rarity IS DISTINCT FROM r.rarity`,
      [snap.titleId, JSON.stringify(snap.rarity)],
    )
    await client.query('DELETE FROM psn_player_trophies WHERE account_id = $1 AND title_id = $2', [accountId, snap.titleId])
    await client.query(
      `INSERT INTO psn_player_trophies (account_id, title_id, trophy_id, earned_at)
       SELECT $1, $2, e.id, e."earnedAt" FROM jsonb_to_recordset($3::jsonb) AS e(id int, "earnedAt" text)`,
      [accountId, snap.titleId, JSON.stringify(snap.earned)],
    )
    await client.query(
      `UPDATE psn_player_games SET trophies_at = $3, groups = $4, completed_at = $5, wanted_at = NULL WHERE account_id = $1 AND title_id = $2`,
      [accountId, snap.titleId, snap.lastTrophyAt, snap.groupsEarned && JSON.stringify(snap.groupsEarned), snap.completedAt],
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/** A trophy's texts in `language`, else English, else whatever language is there. */
const TEXT = (alias: string) => `COALESCE(${alias}.texts->$LANG, ${alias}.texts->'${FALLBACK_LANGUAGE}', (SELECT value FROM jsonb_each(${alias}.texts) LIMIT 1))`
const withLang = (sql: string, index: number) => sql.replaceAll('$LANG', `$${index}`)

type TrophyRow = { trophy_id: number; type: TrophyGrade; group_id: string; hidden: boolean; icon_url: string | null; rarity: number | null; text: [string, string] | null; earned: boolean; earned_at: string | null }

/** One game's stored trophies and groups for the account, texts in `language` (or the nearest kept); null when its trophies were never read. */
export async function loadPsnGameTrophies(accountId: string, titleId: string, language: string): Promise<{ trophies: PsnTrophy[]; groups: PsnTrophyGroup[]; languages: string[]; trophiesAt: string | null } | null> {
  const [trophies, [meta]] = await Promise.all([
    queryRows<TrophyRow>(
      withLang(
        `SELECT t.trophy_id, t.type, t.group_id, t.hidden, t.icon_url, t.rarity, ${TEXT('t')} AS text,
                (p.trophy_id IS NOT NULL) AS earned, p.earned_at
           FROM psn_trophies t
           LEFT JOIN psn_player_trophies p ON p.account_id = $1 AND p.title_id = t.title_id AND p.trophy_id = t.trophy_id
          WHERE t.title_id = $2
          ORDER BY t.trophy_id`,
        3,
      ),
      [accountId, titleId, language],
    ),
    queryRows<{ languages: string[]; group_defs: GroupDef[] | null; groups: GroupEarned[] | null; game: PsnGameProgress; trophies_at: string | null }>(
      `SELECT g.languages, p.trophies_at, COALESCE(g.groups->$3, g.groups->'${FALLBACK_LANGUAGE}', (SELECT value FROM jsonb_each(g.groups) LIMIT 1)) AS group_defs, p.groups, p.game
         FROM psn_player_games p JOIN psn_games g ON g.title_id = p.title_id
        WHERE p.account_id = $1 AND p.title_id = $2`,
      [accountId, titleId, language],
    ),
  ])
  if (!meta || trophies.length === 0) return null
  return {
    trophies: trophies.map(toTrophy),
    groups: toGroups(meta.game, meta.group_defs, meta.groups),
    languages: meta.languages,
    trophiesAt: meta.trophies_at,
  }
}

function toTrophy(r: TrophyRow): PsnTrophy {
  return {
    id: r.trophy_id,
    name: r.text?.[0] ?? '',
    detail: r.text?.[1] ?? '',
    iconUrl: r.icon_url,
    type: r.type,
    groupId: r.group_id,
    hidden: r.hidden,
    earned: r.earned,
    earnedAt: r.earned_at,
    rarity: r.rarity,
  }
}

/** Trophies the account earned on or after `since` (ISO), newest first; `titleIds` narrows them to those games. */
export async function loadPsnEarnedSince(accountId: string, since: string, language: string, titleIds: string[] | null = null): Promise<PsnRecentTrophy[]> {
  const rows = await queryRows<{ game: PsnGameProgress; trophy_id: number; type: TrophyGrade; icon_url: string | null; rarity: number | null; text: [string, string] | null; earned_at: string }>(
    withLang(
      `SELECT g.game, e.trophy_id, t.type, t.icon_url, t.rarity, ${TEXT('t')} AS text, e.earned_at
         FROM psn_player_trophies e
         JOIN psn_player_games g ON g.account_id = e.account_id AND g.title_id = e.title_id
         JOIN psn_trophies t ON t.title_id = e.title_id AND t.trophy_id = e.trophy_id
        WHERE e.account_id = $1 AND e.earned_at >= $2 AND ($4::text[] IS NULL OR e.title_id = ANY($4))
        ORDER BY e.earned_at DESC`,
      3,
    ),
    [accountId, since, language, titleIds],
  )
  return rows.map((r) => ({
    gameId: r.game.id,
    titleId: r.game.titleId,
    gameTitle: r.game.title,
    gameIconUrl: r.game.imageIcon,
    trophyId: r.trophy_id,
    name: r.text?.[0] ?? '',
    iconUrl: r.icon_url,
    type: r.type,
    earnedAt: r.earned_at,
    rarity: r.rarity,
  }))
}
