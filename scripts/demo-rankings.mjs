#!/usr/bin/env node
/**
 * Demo users to try the rankings with, in the PREVIEW database only.
 *
 *   node scripts/demo-rankings.mjs seed [count] [--follower=<username>]
 *   node scripts/demo-rankings.mjs clear
 *
 * Writes only to PREVIEW_DATABASE_URL (from .env.local), and refuses to run
 * when it is missing or points at the same host as DATABASE_URL (production).
 * Demo users are named demo_* (and a few chosen names, FEATURED), cannot
 * sign in (their password is the MARK below, not a hash), and are kept out of
 * the score refresh (their accounts are made up), so their points stay as
 * seeded. They are found by that MARK, never by name. `clear` deletes them, and everything of theirs goes
 * with them (scores, weeks, snapshots, follows). `--follower` makes a real
 * user follow ten of them, for the Following tab.
 */
import fs from 'node:fs'
import pg from 'pg'

const PREFIX = 'demo_'
/** What tells a demo user apart: their password, which no sign-in can match. */
const MARK = '!demo: no sign-in'
/** Demo users with names of their own (no prefix), seeded first. */
const FEATURED = ['spex_guy', 'ratman', 'lester_the_molester', 'rA9', 'bluesoul']
const NAMES = [
  'retro_kaiser', 'lunapixel', 'hollowbit', 'saturnina', 'trophywolf', 'neomarlin', 'cartucho88', 'vespertine', 'mikado', 'ghostpepper',
  'ortiga', 'bitcrusher', 'lazypaladin', 'pumpernickel', 'akane_rx', 'zarzamora', 'kilowatt', 'n0va', 'brisacobalto', 'quietcomet',
  'srtortuga', 'elplatinador', 'pixelmonje', 'cardamomo', 'mothlight', 'tanuki_go', 'redshell', 'speedrunpaco', 'violetamk', 'oxidiana',
  'ferroviaria', 'kraken64', 'lunademiel', 'chiptune', 'galletamaria', 'pochoclo', 'hikari', 'bramble', 'zelda4ever', 'rustyspoon',
  'camomila', 'sidequest', 'manchego', 'polaroid', 'tinyforge', 'mandrake', 'cobaltfox', 'esparrago', 'nimbus', 'yuzu',
]
const COUNTRIES = ['ES', 'MX', 'AR', 'US', 'FR', 'DE', 'IT', 'JP', 'BR', 'CL', 'GB', 'PL', 'PT', 'CO']

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

// A small seeded generator, so the same count gives the same people.
let seed = 20261020
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const between = (a, b) => Math.floor(a + rnd() * (b - a + 1))
const pick = (list) => list[Math.floor(rnd() * list.length)]
const digits = (n) => Array.from({ length: n }, () => between(0, 9)).join('')

const DAY = 86_400
const weekStart = (t) => {
  const d = new Date(t * 1000)
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7))
  return day.toISOString().slice(0, 10)
}
const monthStart = (t) => {
  const d = new Date(t * 1000)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

/** One platform's games for a demo user: points, progress and the days they were earned on. */
function games(skill, count) {
  const today = Math.floor(Date.now() / 1000 / DAY) * DAY
  return Array.from({ length: count }, (_, i) => {
    const completed = rnd() < 0.15 + skill * 0.35
    const total = between(10, 70)
    const earned = completed ? total : between(1, total - 1)
    const points = Math.round((completed ? between(500, 2400) : between(30, 900)) * (0.6 + skill * 0.8))
    // Most points long ago; some in the last weeks, more for the active ones.
    const days = between(1, 4)
    const unlocks = Array.from({ length: days }, () => [today - DAY * (rnd() < 0.25 + skill * 0.3 ? between(0, 30) : between(31, 400)), 0])
    let left = points
    unlocks.forEach((u, k) => {
      u[1] = k === days - 1 ? left : Math.round(points / days)
      left -= u[1]
    })
    return { game_id: 900000 + i, title: `Demo game ${i + 1}`, points, earned, total, completed, unlocks }
  })
}

async function seedDemo(client, count, follower) {
  const people = [...FEATURED, ...NAMES.map((n) => `${PREFIX}${n}`)].slice(0, count)
  if (people.length < count) throw new Error(`At most ${FEATURED.length + NAMES.length} demo users.`)
  const created = []

  for (const name of people) {
    const skill = rnd() ** 1.6 // a few strong hunters, many casual ones
    const platforms = ['ra', 'steam', 'psn'].filter(() => rnd() < 0.65)
    if (platforms.length === 0) platforms.push(pick(['ra', 'steam', 'psn']))
    const accounts = {
      ra: platforms.includes('ra') ? name : null,
      steam: platforms.includes('steam') ? `7656119${digits(10)}` : null,
      psn: platforms.includes('psn') ? digits(19) : null,
    }
    const online = rnd() < 0.2
    const { rows } = await client.query(
      `INSERT INTO users (username, password, location, description, rausername, steamid, steamusername, psnaccountid, psnusername,
                          profile_public, show_in_rankings, show_presence, last_seen_at, score_refreshed_at)
       VALUES ($1, $12, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, '2100-01-01')
       RETURNING id`,
      [
        name, pick(COUNTRIES), 'Demo user for the rankings (preview database only).',
        accounts.ra, accounts.steam, accounts.steam ? name : null, accounts.psn, accounts.psn ? name : null,
        rnd() > 0.06, rnd() > 0.06, online ? new Date() : new Date(Date.now() - between(1, 30 * 24) * 3_600_000), MARK,
      ],
    )
    const id = rows[0].id
    const periods = new Map()
    let totalPoints = 0
    for (const source of platforms) {
      const list = games(skill, between(4, 10 + Math.round(skill * 90)))
      await client.query(
        `INSERT INTO score_games (user_id, source, game_id, account, title, points, earned, total, completed, provisional, unlocks, rules_version)
         SELECT $1, $2, g.game_id, $3, g.title, g.points, g.earned, g.total, g.completed, false, g.unlocks, 1
         FROM jsonb_to_recordset($4::jsonb) AS g(game_id bigint, title text, points int, earned int, total int, completed boolean, unlocks jsonb)`,
        [id, source, accounts[source], JSON.stringify(list)],
      )
      for (const g of list) {
        totalPoints += g.points
        for (const [t, p] of g.unlocks) {
          for (const [kind, start] of [['w', weekStart(t)], ['m', monthStart(t)]]) {
            const key = `${source}|${kind}|${start}`
            periods.set(key, (periods.get(key) ?? 0) + p)
          }
        }
      }
    }
    const rowsOfPeriods = [...periods].map(([k, points]) => {
      const [source, kind, start] = k.split('|')
      return { source, kind, start, points }
    })
    await client.query(
      `INSERT INTO score_periods (user_id, source, kind, start, points)
       SELECT $1, p.source, p.kind, p.start, p.points FROM jsonb_to_recordset($2::jsonb) AS p(source text, kind text, start date, points int)`,
      [id, JSON.stringify(rowsOfPeriods)],
    )
    created.push({ id, name, totalPoints })
  }

  // Where they stood on Monday, a few places off, for the arrows.
  const thisWeek = weekStart(Date.now() / 1000)
  const order = [...created].sort((a, b) => b.totalPoints - a.totalPoints)
  for (const [i, u] of order.entries()) {
    if (rnd() < 0.15) continue // new this week
    await client.query(
      'INSERT INTO score_snapshots (user_id, week, rank, points) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [u.id, thisWeek, Math.max(1, i + 1 + between(-4, 4)), u.totalPoints],
    )
  }

  // They follow each other a little.
  for (const u of created) {
    for (const other of created) {
      if (u !== other && rnd() < 0.12) {
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
  const [command, countArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const follower = process.argv.find((a) => a.startsWith('--follower='))?.split('=')[1]
  if (command !== 'seed' && command !== 'clear') {
    console.log('Usage: node scripts/demo-rankings.mjs seed [count] [--follower=<username>] | clear')
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
      const count = Math.max(1, Math.min(NAMES.length, Number(countArg ?? 40)))
      await client.query('BEGIN')
      const created = await seedDemo(client, count, follower)
      await client.query('COMMIT')
      const top = [...created].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 3)
      console.log(`Created ${created.length} demo users. Top: ${top.map((u) => `${u.name} (${u.totalPoints})`).join(', ')}`)
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
