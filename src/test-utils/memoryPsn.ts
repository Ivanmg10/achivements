import { toGroups } from '@/utils/psnTitles'
import type { DeltaGame, Enrichment, GameSnapshot, GroupDef, GroupEarned, PsnPlayer, PsnSummaryCore, StoredGame } from '@/lib/psnStore'
import type { JobRunner, NextJob, PsnJob, PsnPhase } from '@/lib/psnQueue'
import type { PsnGameProgress, PsnRecentTrophy, PsnTrophy, TrophyGrade } from '@/types/psn'

/**
 * In-memory stand-ins for `@/lib/psnStore` and `@/lib/psnQueue` (#179), for tests that run the real sync and
 * readers without a database: the call baseline and the score parity. They keep what the SQL decides (the delta,
 * the language fallback, only earned trophies kept, one active job per user and phase, priority order); the SQL
 * itself is tested against a mocked pool in psnStore.test.ts and psnQueue.test.ts.
 */
type Def = { type: TrophyGrade; groupId: string; hidden: boolean; iconUrl: string | null; rarity: number | null; texts: Record<string, [string, string]> }
type SetRow = { groups: Record<string, GroupDef[]>; languages: string[]; trophies: Map<number, Def> }
type MineRow = StoredGame & { groups: GroupEarned[] | null; wanted: boolean; earned: Map<number, string | null> }

const players = new Map<string, PsnPlayer>()
const games = new Map<string, Map<string, MineRow>>()
const sets = new Map<string, SetRow>()
const now = () => Date.now()
const FALLBACK = 'en-US'

const pick = <T>(byLang: Record<string, T>, lang: string): T | null => byLang[lang] ?? byLang[FALLBACK] ?? Object.values(byLang)[0] ?? null
const mine = (accountId: string) => games.get(accountId) ?? new Map<string, MineRow>()
const stale = (r: MineRow) => r.trophiesAt !== r.game.lastTrophyAt
const inYear = (r: MineRow, since: string) => (r.game.lastTrophyAt ?? '') >= since && r.game.lastTrophyAt !== null
const byRecent = (a: MineRow, b: MineRow) => Number(b.wanted) - Number(a.wanted) || (b.game.lastTrophyAt ?? '').localeCompare(a.game.lastTrophyAt ?? '')
const stored = (r: MineRow): StoredGame => ({ game: r.game, trophiesAt: r.trophiesAt, completedAt: r.completedAt })

function player(accountId: string): PsnPlayer {
  const p = players.get(accountId) ?? {
    accountId, summary: null, summaryAt: null, profileAt: null, titlesAt: null, enrichment: null, enrichedAt: null, yearAt: null, language: FALLBACK, state: 'new' as const, games: 0,
  }
  players.set(accountId, p)
  return p
}

export const memoryPsnStore = {
  MAX_GAMES: 5000,
  async loadPsnPlayer(accountId: string): Promise<PsnPlayer | null> {
    const p = players.get(accountId)
    return p ? { ...p, games: mine(accountId).size } : null
  },
  async savePsnSummary(accountId: string, summary: PsnSummaryCore, withProfile: boolean) {
    Object.assign(player(accountId), { summary, summaryAt: now(), state: 'ok', ...(withProfile ? { profileAt: now() } : {}) })
  },
  async markPsnPrivate(accountId: string) {
    player(accountId).state = 'private'
  },
  async setPsnLanguage(accountId: string, language: string) {
    if (players.has(accountId)) player(accountId).language = language
  },
  async savePsnEnrichment(accountId: string, enrichment: Enrichment) {
    Object.assign(player(accountId), { enrichment: JSON.parse(JSON.stringify(enrichment)), enrichedAt: now() })
  },
  async markPsnYearReady(accountId: string) {
    player(accountId).yearAt ??= now()
  },
  async loadPsnGames(accountId: string): Promise<StoredGame[]> {
    return [...mine(accountId).values()].sort(byRecent).map(stored)
  },
  async loadPsnGame(accountId: string, titleId: string): Promise<StoredGame | null> {
    const r = mine(accountId).get(titleId)
    return r ? stored(r) : null
  },
  async loadPsnLatestGames(accountId: string, count: number): Promise<StoredGame[]> {
    return [...mine(accountId).values()].filter((r) => r.game.numAwarded > 0).sort((a, b) => (b.game.lastTrophyAt ?? '').localeCompare(a.game.lastTrophyAt ?? '')).slice(0, count).map(stored)
  },
  async savePsnTitles(accountId: string, list: PsnGameProgress[]) {
    Object.assign(player(accountId), { titlesAt: now(), state: 'ok' })
    const before = mine(accountId)
    const after = new Map<string, MineRow>()
    for (const g of list) {
      if (!sets.has(g.titleId)) sets.set(g.titleId, { groups: {}, languages: [], trophies: new Map() })
      const old = before.get(g.titleId)
      after.set(g.titleId, old ? { ...old, game: g } : { game: g, trophiesAt: null, completedAt: null, groups: null, wanted: false, earned: new Map() })
    }
    games.set(accountId, after)
  },
  async psnDeltaGames(accountId: string, since: string, scope: 'year' | 'rest', limit: number): Promise<DeltaGame[]> {
    const rows = [...mine(accountId).values()].filter((r) => (scope === 'year' ? (stale(r) || r.wanted) && inYear(r, since) : r.wanted || (stale(r) && !inYear(r, since))))
    return rows.sort(byRecent).slice(0, limit).map((r) => {
      const set = sets.get(r.game.titleId)!
      return { ...stored(r), languages: [...set.languages], groupLanguages: Object.keys(set.groups), known: [...set.trophies].map(([id, d]) => ({ id, type: d.type, groupId: d.groupId })) }
    })
  },
  async psnDeltaCount(accountId: string, since: string) {
    const all = [...mine(accountId).values()]
    const rows = all.filter((r) => stale(r) || r.wanted)
    return { year: rows.filter((r) => inYear(r, since)).length, total: rows.length, started: all.filter((r) => r.game.lastTrophyAt !== null).length }
  },
  async markPsnWanted(accountId: string, titleId: string) {
    const r = mine(accountId).get(titleId)
    if (r) r.wanted = true
  },
  async savePsnGameTrophies(accountId: string, snap: GameSnapshot) {
    const set = sets.get(snap.titleId)!
    for (const t of snap.defined ?? []) {
      const old = set.trophies.get(t.id)
      set.trophies.set(t.id, { type: t.type, groupId: t.groupId, hidden: t.hidden, iconUrl: t.iconUrl, rarity: old?.rarity ?? null, texts: { ...old?.texts, [snap.language]: [t.name, t.detail] } })
    }
    if (snap.defined && !set.languages.includes(snap.language)) set.languages.push(snap.language)
    if (snap.groupDefs) set.groups[snap.language] = snap.groupDefs
    for (const r of snap.rarity) {
      const d = set.trophies.get(r.id)
      if (d) d.rarity = r.rarity
    }
    const row = mine(accountId).get(snap.titleId)!
    Object.assign(row, { earned: new Map(snap.earned.map((e) => [e.id, e.earnedAt])), trophiesAt: snap.lastTrophyAt, groups: snap.groupsEarned, completedAt: snap.completedAt, wanted: false })
  },
  async loadPsnGameTrophies(accountId: string, titleId: string, language: string) {
    const set = sets.get(titleId)
    const row = mine(accountId).get(titleId)
    if (!set || !row || set.trophies.size === 0) return null
    const trophies: PsnTrophy[] = [...set.trophies].sort(([a], [b]) => a - b).map(([id, d]) => {
      const text = pick(d.texts, language)
      return { id, name: text?.[0] ?? '', detail: text?.[1] ?? '', iconUrl: d.iconUrl, type: d.type, groupId: d.groupId, hidden: d.hidden, earned: row.earned.has(id), earnedAt: row.earned.get(id) ?? null, rarity: d.rarity }
    })
    return { trophies, groups: toGroups(row.game, pick(set.groups, language), row.groups), languages: [...set.languages], trophiesAt: row.trophiesAt }
  },
  async loadPsnEarnedSince(accountId: string, since: string, language: string, titleIds: string[] | null = null): Promise<PsnRecentTrophy[]> {
    const out: PsnRecentTrophy[] = []
    for (const row of mine(accountId).values()) {
      if (titleIds && !titleIds.includes(row.game.titleId)) continue
      for (const [id, earnedAt] of row.earned) {
        const d = sets.get(row.game.titleId)!.trophies.get(id)
        if (!d || earnedAt === null || earnedAt < since) continue
        const text = pick(d.texts, language)
        out.push({ gameId: row.game.id, titleId: row.game.titleId, gameTitle: row.game.title, gameIconUrl: row.game.imageIcon, trophyId: id, name: text?.[0] ?? '', iconUrl: d.iconUrl, type: d.type, earnedAt, rarity: d.rarity })
      }
    }
    return out.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))
  },
  clear() {
    players.clear()
    games.clear()
    sets.clear()
  },
}

type Job = PsnJob & { runAfter: number; status: 'queued' | 'running' | 'done' | 'failed' }
const jobs: Job[] = []
let nextId = 1

export const memoryPsnQueue = {
  PRIORITY: { link: 0, manual: 1, first: 2, cron: 3, history: 4, score: 5 },
  PSN_PHASES: ['summary', 'titles', 'enrich', 'recent', 'history', 'score'],
  CORE_PHASES: ['summary', 'titles'],
  async enqueuePsn(userId: number | string, phase: PsnPhase, priority: number, delayMs = 0) {
    const active = jobs.find((j) => j.userId === Number(userId) && j.phase === phase && (j.status === 'queued' || j.status === 'running'))
    if (!active) jobs.push({ id: nextId++, userId: Number(userId), phase, priority, attempts: 0, runAfter: now() + delayMs, status: 'queued' })
    else if (active.status === 'queued') Object.assign(active, { priority: Math.min(active.priority, priority), runAfter: Math.min(active.runAfter, now() + delayMs) })
  },
  async psnQueueOf(userId: number | string) {
    const mineJobs = jobs.filter((j) => j.userId === Number(userId) && (j.status === 'queued' || j.status === 'running'))
    return { jobs: mineJobs.map(({ phase, status }) => ({ phase, status, error: null })), failedRecently: false, ahead: 0 }
  },
  async psnJobsOf(userId: number | string) {
    return jobs.filter((j) => j.userId === Number(userId) && (j.status === 'queued' || j.status === 'running')).map(({ phase, status, priority }) => ({ phase, status, priority }))
  },
  /** Runs due jobs, most urgent first, until none is left; a job that throws goes back after 60 s. */
  async drainPsnQueue(run: JobRunner): Promise<number> {
    let ran = 0
    for (;;) {
      const job = jobs.filter((j) => j.status === 'queued' && j.runAfter <= now()).sort((a, b) => a.priority - b.priority || a.runAfter - b.runAfter)[0]
      if (!job) return ran
      job.status = 'running'
      job.attempts++
      ran++
      let next: NextJob[]
      try {
        next = await run(job)
      } catch {
        Object.assign(job, { status: job.attempts >= 5 ? 'failed' : 'queued', runAfter: now() + 60_000 })
        continue
      }
      job.status = 'done'
      for (const n of next) await memoryPsnQueue.enqueuePsn(job.userId, n.phase, n.priority, n.delayMs)
    }
  },
  /** Jobs still waiting (a retry, a chunk queued again): the load test drains until none is left. */
  queued: () => jobs.filter((j) => j.status === 'queued').length,
  /** The jobs that ran, oldest first: for asserting what a sync did. */
  history: () => jobs.filter((j) => j.status === 'done').map((j) => j.phase),
  clear() {
    jobs.length = 0
  },
}
