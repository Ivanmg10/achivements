#!/usr/bin/env node
/**
 * Demo users to try the rankings and public profiles with, in the PREVIEW
 * database only.
 *
 *   node scripts/demo-rankings.mjs seed [--follower=<username>]
 *   node scripts/demo-rankings.mjs clear
 *
 * Writes only to PREVIEW_DATABASE_URL (from .env.local), and refuses to run
 * when it is missing or points at the same host as DATABASE_URL (production).
 *
 * Who they are is in demo-personas.mjs (each with a twin: same tastes, another name and picture). Their Steam and PSN accounts are made
 * up, so nothing can be asked of Steam or Sony for them: instead the answers
 * their profile asks for (library, recent unlocks, the year's feed, each
 * game's list, the PSN summary) are written into steam_cache under their fake
 * accounts, never expiring. The games are real: their definitions (names,
 * badges, rarity) are taken from what the preview database already has cached
 * for real users (`loadPool`); only who earned what, and when, is invented.
 * Their Vault Points come from the same lists, through the real formula.
 *
 * No RetroAchievements: the dev server does not read RA's cache from the
 * database, and a made-up RA name could be a real person's.
 *
 * They cannot sign in (their password is the MARK below, not a hash), are kept
 * out of the score refresh (score_refreshed_at in 2100), and are found by that
 * MARK, never by name. `clear` deletes them, and everything of theirs goes with
 * them (scores, weeks, snapshots, follows, showcase, cache rows). `--follower`
 * makes a real user follow ten of them, for the Following tab.
 */
import fs from 'node:fs'
import pg from 'pg'
import { RULES_VERSION, scoreGame, stackFactors, stackKey } from '../src/utils/vaultScore.ts'
import { psnGradeShare, psnScoreInputs, steamScoreInputs } from '../src/utils/vaultScoreInputs.ts'
import { monthStart, weekStart } from '../src/utils/vaultLevel.ts'
import { PERSONAS } from './demo-personas.mjs'

/** What tells a demo user apart: their password, which no sign-in can match. */
const MARK = '!demo: no sign-in'
const FOREVER = '2100-01-01'
/** The app's languages as Steam names them (src/utils/steamLanguage.ts). */
const STEAM_LANGS = ['english', 'spanish', 'portuguese', 'french', 'german', 'italian', 'russian', 'polish', 'japanese']
/** Sony's, only English and Spanish: each is a full copy of every trophy list. Other languages show PSN's feeds as failed. */
const PSN_LANGS = ['en-US', 'es-ES']
const PSN_POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 300 }
const DAY = 86_400
/**
 * Their Vault Points are multiplied by this. Each plays a handful of games and real users have
 * hundreds, so without it every real user would sit above all of them; with it about half of
 * them rank above a library of a few hundred games, and the page below the top can be tried.
 */
const SCALE = 30
const scaled = (s) => ({ ...s, points: s.points * SCALE, unlocks: s.unlocks.map(([t, p]) => [t, p * SCALE]) })

/** .env.local, read the way Next reads it (KEY=value, quotes stripped). */
function readEnv() {
  if (!fs.existsSync('.env.local')) throw new Error('No .env.local here: run it from the repo root.')
  return Object.fromEntries(
    fs.readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_][A-Z0-9_]*=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^['"]|['"]$/g, '')]),
  )
}

/** The preview database, or a refusal: never production. */
function previewUrl(env) {
  const pre = env.PREVIEW_DATABASE_URL
  if (!pre) throw new Error('PREVIEW_DATABASE_URL is not set in .env.local: refusing (this only runs on the preview database).')
  const host = new URL(pre).hostname
  if (env.DATABASE_URL && new URL(env.DATABASE_URL).hostname === host) {
    throw new Error('PREVIEW_DATABASE_URL points at the same host as DATABASE_URL (production): refusing.')
  }
  return { url: pre, endpoint: host.split('.')[0] }
}

// A small seeded generator, so every seed gives the same people.
let seed = 20261020
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const between = (a, b) => Math.floor(a + rnd() * (b - a + 1))
const digits = (n) => Array.from({ length: n }, () => between(0, 9)).join('')
const iso = (t) => new Date(t * 1000).toISOString()
const sonyIso = (t) => iso(t).replace('.000Z', 'Z')
const psnNumericId = (titleId) => Number(titleId.slice(4, 9) + titleId.slice(10))

/**
 * Real games' definitions from the preview database's cache, expired or not:
 * Steam schemas and global rarity, PSN trophy lists, groups and their entry in
 * a library. Whatever a persona plays that is missing here is left out.
 */
async function loadPool(client) {
  const { rows } = await client.query(
    `SELECT cache_key, cache_data FROM steam_cache
     WHERE cache_key LIKE 'steamSchema:%' OR cache_key LIKE 'steamGlobalPct:%' OR cache_key LIKE 'steamOwned2:%'
        OR cache_key LIKE 'psn:titles:v12:%' OR cache_key LIKE 'psn:trophies:v2:%' OR cache_key LIKE 'psn:groups:%'
     ORDER BY created_at`,
  )
  const pool = { steam: new Map(), psn: new Map() }
  const steam = (id) => pool.steam.get(id) ?? pool.steam.set(id, { schema: {}, pct: new Map() }).get(id)
  const psn = (id) => pool.psn.get(id) ?? pool.psn.set(id, { trophies: {}, groups: {} }).get(id)
  for (const { cache_key: key, cache_data: data } of rows) {
    const parts = key.split(':')
    if (parts[0] === 'steamSchema') steam(Number(parts[1])).schema[parts[2]] = data
    else if (parts[0] === 'steamGlobalPct') {
      for (const a of data?.achievementpercentages?.achievements ?? []) steam(Number(parts[1])).pct.set(a.name, parseFloat(a.percent))
    } else if (parts[0] === 'steamOwned2') for (const g of data) steam(g.id).title ??= g.title
    else if (parts[1] === 'titles') for (const g of data) psn(g.titleId).meta ??= g
    else {
      // psn:trophies:v2:<account>:<titleId>:<lastTrophyAt, with colons>:<lang>
      const lang = parts.at(-1)
      const titleId = parts[1] === 'trophies' ? parts[4] : parts[3]
      psn(titleId)[parts[1] === 'trophies' ? 'trophies' : 'groups'][lang] = data
    }
  }
  return pool
}

/**
 * When each of `count` unlocks happened, oldest first: spread from `span` days before `last` days ago, at the persona's hours.
 * With `run`, the last `run` of them fall one a day up to today (a streak of that many days), and the rest before it.
 */
function unlockTimes(count, last, span, persona, run = 0) {
  const now = Math.floor(Date.now() / 1000)
  const today = Math.floor(now / DAY) * DAY
  const [from, to] = persona.hours
  const width = ((to - from + 24) % 24) || 24
  const tail = Math.min(run, count)
  const spread = count - tail
  const before = tail > 0 ? Math.max(last, tail) : last
  const times = Array.from({ length: spread }, (_, i) => {
    let day = today - DAY * (before + Math.round(spread > 1 ? span * (1 - i / (spread - 1)) : 0))
    if (persona.weekends) while (![0, 6].includes(new Date(day * 1000).getUTCDay())) day -= DAY
    const t = day + Math.floor((from + rnd() * width) * 3600)
    return Math.min(t, now - between(5, 90) * 60)
  })
  // The streak's unlocks stay inside their own day, even for hours that wrap midnight.
  for (let k = tail - 1; k >= 0; k--) {
    const t = today - DAY * k + Math.floor((from + rnd() * Math.min(width, 24 - from)) * 3600)
    times.push(Math.min(t, now - between(5, 90) * 60))
  }
  return times.sort((a, b) => a - b)
}

/** Which achievements of a list are earned: the most common first, with some luck. */
function pickEarned(list, rarity, share) {
  const order = [...list].sort((a, b) => (rarity(b) ?? 50) * (0.6 + rnd() * 0.8) - (rarity(a) ?? 50) * (0.6 + rnd() * 0.8))
  return order.slice(0, Math.max(1, Math.round(list.length * share)))
}

function steamGame(persona, pool, [appId, share, last, span], run = 0) {
  const def = pool.steam.get(appId)
  const english = def?.schema.english
  if (!english?.length || !def.title) return null
  const earned = pickEarned(english, (a) => def.pct.get(a.name), share)
  const times = unlockTimes(earned.length, last, span, persona, run)
  const when = new Map(earned.map((a, i) => [a.name, times[i]]))
  const player = english.map((a) => ({
    name: a.displayName, apiname: a.name, achieved: when.has(a.name) ? 1 : 0, unlocktime: when.get(a.name) ?? 0, description: a.description ?? '',
  }))
  const lastUnlock = times.at(-1)
  const lastPlayed = lastUnlock + between(10, 90) * 60
  const minutes = earned.length * between(15, 70) + between(30, 300)
  return {
    source: 'steam', id: appId, title: def.title, def, player, when, lastUnlock,
    score: scaled(scoreGame(steamScoreInputs(player, def.pct))),
    progress: {
      id: appId, title: def.title, pctWon: Math.round((earned.length / english.length) * 10000) / 100, _source: 'steam', hasStats: true,
      imageIcon: `/api/steam/icon?appid=${appId}`, imgLogoUrl: '', lastPlayed: iso(lastPlayed), lastUnlock: iso(lastUnlock),
      numAwarded: earned.length, consoleName: 'Steam', maxPossible: english.length,
      playtime2Weeks: Date.now() / 1000 - lastPlayed < 14 * DAY ? Math.min(minutes, between(40, 900)) : 0, playtimeForever: minutes, achievementsLoaded: true,
    },
  }
}

function psnGame(persona, pool, [titleId, share, last, span], run = 0) {
  const def = pool.psn.get(titleId)
  const base = def?.trophies['en-US']
  if (!def?.meta || !base?.length) return null
  // Without its groups' names, a game's DLC is left out, so the list and its groups agree.
  const keep = def.groups['en-US'] ? () => true : (t) => t.groupId === 'default'
  const list = base.filter(keep)
  const scope = share === 'p' ? list.filter((t) => t.groupId === 'default') : list
  const full = share === 'p' || share === 1
  const candidates = full ? scope : scope.filter((t) => t.type !== 'platinum')
  const earned = full ? candidates : pickEarned(candidates, (t) => t.rarity, share)
  // The platinum comes last.
  earned.sort((a, b) => (a.type === 'platinum') - (b.type === 'platinum'))
  const times = unlockTimes(earned.length, last, span, persona, run)
  const when = new Map(earned.map((t, i) => [t.id, times[i]]))
  const trophiesIn = (lang) => (def.trophies[lang] ?? base).filter(keep).map((t) => ({
    ...t, earned: when.has(t.id), earnedAt: when.has(t.id) ? sonyIso(when.get(t.id)) : null,
  }))
  const trophies = Object.fromEntries(PSN_LANGS.map((l) => [l, trophiesIn(l)]))
  const count = (ts) => ts.reduce((c, t) => ({ ...c, [t.type]: c[t.type] + 1 }), { bronze: 0, silver: 0, gold: 0, platinum: 0 })
  const defined = count(trophies['en-US'])
  const got = count(trophies['en-US'].filter((t) => t.earned))
  const groupsIn = (lang) => (def.groups[lang] ?? def.groups['en-US'] ?? [{ id: 'default', name: def.meta.title, iconUrl: def.meta.imageIcon }]).map((g) => {
    const mine = trophies['en-US'].filter((t) => t.groupId === g.id)
    const d = count(mine)
    const e = count(mine.filter((t) => t.earned))
    return { id: g.id, name: g.name, iconUrl: g.iconUrl, defined: d, earned: e, progress: Math.round(psnGradeShare(e, d) * 100) }
  })
  const lastUnlock = times.at(-1)
  const lastTrophyAt = sonyIso(lastUnlock)
  const played = def.meta.playedAs?.length > 0
  return {
    source: 'psn', id: psnNumericId(titleId), titleId, title: def.meta.title, trophies, lastUnlock, lastTrophyAt, earnedCounts: got,
    groups: Object.fromEntries(PSN_LANGS.map((l) => [l, groupsIn(l)])),
    score: scaled(scoreGame(psnScoreInputs(trophies['en-US']))),
    progress: {
      ...def.meta, earned: got, defined, hasDlc: trophies['en-US'].some((t) => t.groupId !== 'default'),
      numAwarded: earned.length, maxPossible: trophies['en-US'].length, pctWon: Math.round(psnGradeShare(got, defined) * 100),
      lastPlayed: iso(lastUnlock + between(5, 60) * 60), lastTrophyAt,
      playtimeMinutes: played ? earned.length * between(20, 60) + between(60, 600) : null, playCount: played ? between(3, 60) : null, collection: null,
    },
  }
}

/** Every cache row a persona's profile reads, keyed as the app keys them. */
function cacheRows(persona, accounts, steam, psn) {
  const rows = []
  const put = (key, data) => rows.push({ key, data })
  const now = Date.now() / 1000
  if (steam.length > 0) {
    const sid = accounts.steam
    const owned = steam.map((g) => g.progress).sort((a, b) => b.playtimeForever - a.playtimeForever)
    put(`steamOwned2:${sid}`, owned)
    put(`steamRecent:${sid}`, owned.filter((g) => g.playtime2Weeks > 0).sort((a, b) => b.lastPlayed.localeCompare(a.lastPlayed)).slice(0, 20))
    for (const g of steam) put(`steamAch:${sid}:${g.id}`, g.player)
    for (const lang of STEAM_LANGS) {
      const unlocks = steam.flatMap((g) => {
        const names = new Map((g.def.schema[lang] ?? g.def.schema.english).map((a) => [a.name, a]))
        return [...g.when].map(([apiname, t]) => ({
          appId: g.id, gameTitle: g.title, apiname, title: names.get(apiname)?.displayName ?? apiname,
          badgeUrl: names.get(apiname)?.icon ?? '', unlockedAt: iso(t), globalPct: g.def.pct.get(apiname) ?? null,
        }))
      }).sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
      const since = (days) => unlocks.filter((u) => Date.parse(u.unlockedAt) / 1000 >= now - days * DAY)
      put(`steamRecentAch:${sid}:${lang}`, unlocks.slice(0, 5))
      put(`steamActivity:${sid}:${lang}`, since(60))
      put(`steamUnlockYear:${sid}:${lang}`, since(365))
    }
    const total = steam.reduce((s, g) => s + g.when.size, 0)
    put(`steamProfile_v2:${sid}`, {
      steamid: sid, personaname: persona.name, avatar: persona.avatar, avatarmedium: persona.avatar, avatarfull: persona.avatar,
      loccountrycode: persona.country, timecreated: Math.floor(now) - between(2, 14) * 365 * DAY,
      personastate: persona.seen === 'online' ? 1 : 0, level: 5 + Math.round(total / 6),
    })
  }
  if (psn.length > 0) {
    const pid = accounts.psn
    put(`psn:titles:v12:${pid}`, psn.map((g) => g.progress).sort((a, b) => b.lastPlayed.localeCompare(a.lastPlayed)))
    for (const g of psn) {
      for (const lang of PSN_LANGS) {
        put(`psn:trophies:v2:${pid}:${g.titleId}:${g.lastTrophyAt}:${lang}`, g.trophies[lang])
        put(`psn:groups:${pid}:${g.titleId}:${g.lastTrophyAt}:${lang}`, g.groups[lang])
      }
    }
    const earned = psn.reduce((c, g) => {
      for (const k of Object.keys(c)) c[k] += g.earnedCounts[k]
      return c
    }, { bronze: 0, silver: 0, gold: 0, platinum: 0 })
    const points = Object.entries(earned).reduce((s, [k, n]) => s + n * PSN_POINTS[k], 0)
    const level = Math.max(1, Math.round(points / 60))
    put(`psn:summary:v3:${pid}`, {
      onlineId: persona.name, avatarUrl: persona.avatar, aboutMe: '', isPlus: rnd() < 0.6,
      trophyLevel: level, tier: Math.min(10, Math.floor(level / 100) + 1), levelProgress: between(0, 99), earned, games: psn.length,
    })
  }
  return rows
}

/** Their rarest earned achievements, two per game at most, for the showcase (and the avatar). */
function showcaseOf(steam, psn, count) {
  const steamOnes = steam.flatMap((g) => {
    const names = new Map((g.def.schema.spanish ?? g.def.schema.english).map((a) => [a.name, a]))
    return [...g.when].map(([key, t]) => ({
      source: 'steam', game_id: g.id, key, game_title: g.title, title: names.get(key)?.displayName ?? key,
      description: names.get(key)?.description ?? '', badge: names.get(key)?.icon ?? null, earned_at: iso(t), rarity: g.def.pct.get(key) ?? 50,
    }))
  })
  const psnOnes = psn.flatMap((g) => g.trophies['es-ES'].filter((t) => t.earned).map((t) => ({
    source: 'psn', game_id: g.id, key: String(t.id), game_title: g.title, title: t.name, description: t.detail,
    badge: t.iconUrl, earned_at: t.earnedAt, rarity: t.rarity ?? 50,
  })))
  const perGame = new Map()
  return [...steamOnes, ...psnOnes].sort((a, b) => a.rarity - b.rarity).filter((a) => {
    const k = `${a.source}:${a.game_id}`
    perGame.set(k, (perGame.get(k) ?? 0) + 1)
    return perGame.get(k) <= 2
  }).slice(0, count)
}

async function seedPersona(client, persona, pool) {
  const accounts = { steam: persona.steam ? `7656119${digits(10)}` : null, psn: persona.psn ? digits(19) : null }
  // The streak is played on their favourite game, of the first platform they have.
  const runOn = (source, i) => (i === 0 && source === (persona.steam ? 'steam' : 'psn') ? persona.streak ?? 0 : 0)
  const steam = (persona.steam ?? []).map((g, i) => steamGame(persona, pool, g, runOn('steam', i))).filter(Boolean)
  const psn = (persona.psn ?? []).map((g, i) => psnGame(persona, pool, g, runOn('psn', i))).filter(Boolean)
  const fav = (persona.steam ? steam : psn)[0]
  const got = fav ? (fav.source === 'steam' ? fav.when.size : Object.keys(fav.earnedCounts).reduce((n, k) => n + fav.earnedCounts[k], 0)) : 0
  if ((persona.streak ?? 0) > got) console.warn(`  ${persona.name}: a streak of ${persona.streak} asked, ${got} days possible (${got} unlocks)`)
  const missing = (persona.steam?.length ?? 0) + (persona.psn?.length ?? 0) - steam.length - psn.length
  if (missing > 0) console.warn(`  ${persona.name}: ${missing} game(s) not in the cache, left out`)
  const showcase = showcaseOf(steam, psn, 5)
  // A twin shows another of their badges as their picture.
  persona.avatar = showcase[persona.avatarIndex ?? 0]?.badge ?? showcase[0]?.badge ?? null

  const seen = persona.seen === 'online' ? FOREVER : new Date(Date.now() - (persona.seen === 'hidden' ? 30 : persona.seen) * 3_600_000)
  const favorite = (g) => g && { id: g.id, title: g.title, imageIcon: g.progress.imageIcon }
  const { rows } = await client.query(
    `INSERT INTO users (username, password, location, description, theme, avatar, gender, gender_public,
                        steamid, steamusername, psnaccountid, psnusername, favorite_steam_game, favorite_psn_game,
                        profile_public, show_in_rankings, show_presence, last_seen_at, score_refreshed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     RETURNING id`,
    [
      persona.name, MARK, persona.country, persona.bio, persona.theme, persona.avatar, persona.gender ?? null, persona.genderPublic === true,
      steam.length ? accounts.steam : null, steam.length ? persona.name : null, psn.length ? accounts.psn : null, psn.length ? persona.name : null,
      favorite(steam[0]) ?? null, favorite(psn[0]) ?? null,
      !persona.private, !persona.unranked, persona.seen !== 'hidden', seen, FOREVER,
    ],
  )
  const id = rows[0].id

  // Their Vault Points, as the refresh would store them.
  const periods = new Map()
  let total = 0
  let thisWeek = 0
  const monday = weekStart(new Date())
  for (const [source, games, account] of [['steam', steam, accounts.steam], ['psn', psn, accounts.psn]]) {
    if (games.length === 0) continue
    const factors = stackFactors(games.map((g) => ({ key: stackKey(g.title), points: g.score.points })))
    const list = games.map((g, i) => ({ game_id: g.id, title: g.title, ...g.score, stack_factor: factors[i] }))
    await client.query(
      `INSERT INTO score_games (user_id, source, game_id, account, title, points, stack_factor, earned, total, completed, provisional, unlocks, rules_version)
       SELECT $1, $2, g.game_id, $3, g.title, g.points, g.stack_factor, g.earned, g.total, g.completed, false, g.unlocks, $4
       FROM jsonb_to_recordset($5::jsonb) AS g(game_id bigint, title text, points int, stack_factor real, earned int, total int, completed boolean, unlocks jsonb)`,
      [id, source, account, RULES_VERSION, JSON.stringify(list)],
    )
    for (const g of list) {
      total += g.points * g.stack_factor
      for (const [t, p] of g.unlocks) {
        if (!t || !p) continue
        const date = new Date(t * 1000)
        if (weekStart(date) === monday) thisWeek += p * g.stack_factor
        for (const key of [`${source}|w|${weekStart(date)}`, `${source}|m|${monthStart(date)}`]) periods.set(key, (periods.get(key) ?? 0) + p * g.stack_factor)
      }
    }
  }
  const periodRows = [...periods].map(([k, points]) => {
    const [source, kind, start] = k.split('|')
    return { source, kind, start, points: Math.round(points) }
  }).filter((p) => p.points > 0)
  await client.query(
    `INSERT INTO score_periods (user_id, source, kind, start, points)
     SELECT $1, p.source, p.kind, p.start, p.points FROM jsonb_to_recordset($2::jsonb) AS p(source text, kind text, start date, points int)`,
    [id, JSON.stringify(periodRows)],
  )

  for (const [i, a] of showcase.slice(0, persona.showcase).entries()) {
    await client.query(
      `INSERT INTO showcase_achievements (user_id, source, game_id, achievement_key, game_title, title, description, badge, earned_at, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, a.source, a.game_id, a.key, a.game_title, a.title, a.description, a.badge, a.earned_at, i],
    )
  }

  const cache = cacheRows(persona, accounts, steam, psn)
  await client.query(
    `INSERT INTO steam_cache (cache_key, user_id, cache_data, expires_at)
     SELECT c.key, $1, c.data, $2 FROM jsonb_to_recordset($3::jsonb) AS c(key text, data jsonb)
     ON CONFLICT (cache_key) DO UPDATE SET user_id = EXCLUDED.user_id, cache_data = EXCLUDED.cache_data, expires_at = EXCLUDED.expires_at, created_at = now()`,
    [id, FOREVER, JSON.stringify(cache)],
  )
  return { id, name: persona.name, total: Math.round(total), thisWeek: Math.round(thisWeek), ranked: !persona.unranked, isNew: persona.isNew, games: steam.length + psn.length, bytes: JSON.stringify(cache).length }
}

async function seedDemo(client, follower) {
  const pool = await loadPool(client)
  console.log(`Games in the cache: ${pool.steam.size} Steam, ${pool.psn.size} PSN.`)
  const created = []
  for (const persona of PERSONAS) created.push(await seedPersona(client, persona, pool))

  // Where they stood on Monday: before this week's points, among the real users too (their totals as they are now).
  const monday = weekStart(new Date())
  const { rows: real } = await client.query(
    `SELECT u.id, SUM(g.points * g.stack_factor) AS total FROM users u JOIN score_games g ON g.user_id = u.id
     WHERE u.password <> $1 AND u.profile_public AND u.show_in_rankings AND g.flag IS DISTINCT FROM 'suspect' GROUP BY u.id`,
    [MARK],
  )
  const before = [...created.filter((u) => u.ranked && !u.isNew), ...real.map((r) => ({ real: true, total: Number(r.total), thisWeek: 0 }))]
    .sort((a, b) => (b.total - b.thisWeek) - (a.total - a.thisWeek))
  for (const [i, u] of before.entries()) {
    if (u.real) continue
    await client.query(
      'INSERT INTO score_snapshots (user_id, week, rank, points) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [u.id, monday, i + 1, u.total - u.thisWeek],
    )
  }

  // They follow each other a little; the first five, each other.
  for (const u of created) {
    for (const other of created) {
      if (u !== other && (rnd() < 0.15 || (created.indexOf(u) < 5 && created.indexOf(other) < 5))) {
        await client.query('INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [u.id, other.id])
      }
    }
  }
  if (follower) {
    const { rows } = await client.query('SELECT id FROM users WHERE username = $1', [follower])
    if (!rows[0]) throw new Error(`No user ${follower} to follow them.`)
    for (const u of created.slice(0, 10)) {
      await client.query('INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [rows[0].id, u.id])
    }
  }
  return created
}

async function main() {
  const [command] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const follower = process.argv.find((a) => a.startsWith('--follower='))?.split('=')[1]
  if (command !== 'seed' && command !== 'clear') {
    console.log('Usage: node scripts/demo-rankings.mjs seed [--follower=<username>] | clear')
    process.exit(1)
  }
  const { url, endpoint } = previewUrl(readEnv())
  console.log(`Preview database: ${endpoint}`)
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    // Starting from a clean slate either way: seeding twice does not duplicate anyone.
    const { rowCount } = await client.query('DELETE FROM users WHERE password = $1', [MARK])
    console.log(`Removed ${rowCount} demo users.`)
    if (command === 'seed') {
      await client.query('BEGIN')
      const created = await seedDemo(client, follower)
      await client.query('COMMIT')
      for (const u of [...created].sort((a, b) => b.total - a.total)) {
        console.log(`  ${u.name.padEnd(20)} ${String(u.total).padStart(7)} PV  ${u.games} games  ${(u.bytes / 1024).toFixed(0)} KB cached`)
      }
      console.log(`Created ${created.length} demo users, ${(created.reduce((s, u) => s + u.bytes, 0) / 1048576).toFixed(1)} MB of cache.`)
      console.log('The rankings cache lists for up to 5 minutes: restart the dev server to see them at once.')
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
