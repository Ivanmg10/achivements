import { describePsnSync, STALE_MS, type PsnSyncFacts } from './psnSyncStage'

const NOW = Date.UTC(2026, 10, 19, 12)
const facts = (over: Partial<PsnSyncFacts> = {}, player: Partial<NonNullable<PsnSyncFacts['player']>> | null = {}): PsnSyncFacts => ({
  player: player && { summaryAt: NOW, titlesAt: NOW, enrichedAt: NOW, yearAt: NOW, state: 'ok', ...player },
  jobs: [],
  failedRecently: false,
  ahead: 0,
  pending: { year: 0, total: 0, started: 40 },
  callsPerMin: 30,
  paused: false,
  syncedAt: NOW,
  now: NOW,
  ...over,
})

test('nothing stored yet: the core is being read, the trophies first', () => {
  const v = describePsnSync(facts({ jobs: [{ phase: 'summary', status: 'running', error: null }], pending: { year: 0, total: 0, started: 0 } }, null))
  expect(v).toMatchObject({ stage: 'syncing_core', progress: 0, steps: { trophies: 'active', library: 'waiting', playtime: 'waiting', history: 'waiting' } })
  expect(v.etaSeconds).toBe(5)
})

test('the list stored, the year not: usable, with a real share of games read', () => {
  const v = describePsnSync(facts({ jobs: [{ phase: 'recent', status: 'running', error: null }, { phase: 'enrich', status: 'queued', error: null }], pending: { year: 10, total: 30, started: 40 } }, { yearAt: null }))
  expect(v).toMatchObject({ stage: 'ready_partial', games: { read: 10, total: 40 }, progress: 48 })
  expect(v.steps).toEqual({ trophies: 'done', library: 'done', playtime: 'active', history: 'active' })
  // (22 + 30 × 2) calls at 30 a minute.
  expect(v.etaSeconds).toBe(164)
})

test('the year whole, older games left: enriching; then ready at 100 %', () => {
  expect(describePsnSync(facts({ pending: { year: 0, total: 5, started: 40 } })).stage).toBe('enriching')
  const ready = describePsnSync(facts())
  expect(ready).toMatchObject({ stage: 'ready', progress: 100, etaSeconds: null, position: null, trouble: null, stale: false })
  expect(ready.steps.history).toBe('done')
})

test('waiting behind others: its place in line, none once one of its jobs runs', () => {
  const queued = [{ phase: 'titles', status: 'queued' as const, error: null }]
  expect(describePsnSync(facts({ jobs: queued, ahead: 3 }, { titlesAt: null })).position).toBe(4)
  expect(describePsnSync(facts({ jobs: [{ ...queued[0], status: 'running' }], ahead: 3 }, { titlesAt: null })).position).toBeNull()
})

test('old data, a pause and a failing job are overlays on the stage', () => {
  expect(describePsnSync(facts({ syncedAt: NOW - STALE_MS })).stale).toBe(true)
  expect(describePsnSync(facts({ paused: true, callsPerMin: 0 }, { yearAt: null })).trouble).toBe('paused')
  expect(describePsnSync(facts({ jobs: [{ phase: 'recent', status: 'queued', error: 'failed' }] })).trouble).toBe('failing')
  // The app's own budget spent is not trouble: it only waits.
  expect(describePsnSync(facts({ jobs: [{ phase: 'recent', status: 'queued', error: 'busy' }] })).trouble).toBeNull()
  expect(describePsnSync(facts({ failedRecently: true })).trouble).toBe('failing')
})

test('a hidden profile is its own stage, and no progress is invented', () => {
  expect(describePsnSync(facts({}, { state: 'private', titlesAt: null }))).toMatchObject({ stage: 'private', progress: 100, etaSeconds: null })
})
