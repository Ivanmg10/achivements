/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnStore', () => jest.requireActual('@/test-utils/memoryPsn').memoryPsnStore)
jest.mock('@/lib/psnQueue', () => ({
  ...jest.requireActual('@/test-utils/memoryPsn').memoryPsnQueue,
  drainPsnQueue: jest.fn(async () => 0),
}))
jest.mock('@/lib/queryRows', () => ({ queryRows: jest.fn() }))
jest.mock('@/lib/scoreRefresh', () => ({ runScoreAfterSync: jest.fn(async () => true) }))
jest.mock('@/lib/runLater', () => ({ runLater: jest.fn() }))
jest.mock('@/lib/psnClient', () => ({
  DEFAULT_LANGUAGE: 'en-US',
  fetchPsnSummary: jest.fn(),
  fetchPsnTitles: jest.fn(),
  fetchPsnEnrichment: jest.fn(async () => ({ played: [], sets: {}, art: {} })),
  fetchPsnGame: jest.fn(),
}))

import { memoryPsnQueue as queue, memoryPsnStore as store } from '@/test-utils/memoryPsn'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { fetchPsnEnrichment, fetchPsnGame, fetchPsnSummary, fetchPsnTitles } from '@/lib/psnClient'
import { PsnBusyError, PsnError } from '@/lib/psnErrors'
import { queryRows } from '@/lib/queryRows'
import { runScoreAfterSync } from '@/lib/scoreRefresh'
import { runLater } from '@/lib/runLater'
import { CHUNK, kickPsnSync, readPsnOnLink, runPsnJob } from './psnSync'
import type { PsnJob, PsnPhase } from './psnQueue'
import type { GameSnapshot, PsnSummaryCore } from './psnStore'

const SUMMARY: PsnSummaryCore = { onlineId: 'p', avatarUrl: null, aboutMe: '', isPlus: false, trophyLevel: 1, tier: 1, levelProgress: 0, earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 } }
const RECENT = new Date().toISOString()
const game = (i: number, lastTrophyAt: string | null = RECENT) =>
  psnGameFixture({ titleId: `NPWR${String(10000 + i)}_00`, id: i, numAwarded: lastTrophyAt ? 1 : 0, lastTrophyAt })
const job = (phase: PsnPhase, priority = 0): PsnJob => ({ id: 1, userId: 7, phase, priority, attempts: 1 })
const snapOf = (_acc: string, g: ReturnType<typeof game>): GameSnapshot => ({ titleId: g.titleId, lastTrophyAt: g.lastTrophyAt, language: 'en-US', defined: [], earned: [], rarity: [], groupDefs: null, groupsEarned: null, completedAt: null })

beforeEach(() => {
  store.clear()
  queue.clear()
  jest.clearAllMocks()
  ;(queryRows as jest.Mock).mockResolvedValue([{ psnaccountid: 'acc' }])
  ;(fetchPsnSummary as jest.Mock).mockResolvedValue({ summary: SUMMARY, withProfile: true })
  ;(fetchPsnGame as jest.Mock).mockImplementation(async (acc: string, g: ReturnType<typeof game>) => snapOf(acc, g))
})

test('a user with no PSN linked any more: nothing to do', async () => {
  ;(queryRows as jest.Mock).mockResolvedValue([{ psnaccountid: null }])
  expect(await runPsnJob(job('summary'))).toEqual([])
  expect(fetchPsnSummary).not.toHaveBeenCalled()
})

test('summary: stored; a first read or a link goes on to the list, nothing moved and listed today stops there', async () => {
  expect(await runPsnJob(job('summary', 3))).toEqual([{ phase: 'titles', priority: 3 }])
  expect((await store.loadPsnPlayer('acc'))!.summary).toEqual(SUMMARY)
  await store.savePsnTitles('acc', [])
  expect(await runPsnJob(job('summary', 3))).toEqual([])
  // The profile is passed in as known while it is less than a day old: 1 request.
  expect((fetchPsnSummary as jest.Mock).mock.calls[1][1]).toEqual(SUMMARY)
  // Manual (or link) always reads the list.
  expect(await runPsnJob(job('summary', 1))).toEqual([{ phase: 'titles', priority: 1 }])
})

test('a hidden profile is stored as such, and the chain stops', async () => {
  ;(fetchPsnSummary as jest.Mock).mockRejectedValue(new PsnError('Not permitted by access control', 2240526))
  expect(await runPsnJob(job('summary'))).toEqual([])
  expect((await store.loadPsnPlayer('acc'))!.state).toBe('private')
})

test('titles: stores the list, then play data when something moved and the delta, as their own jobs', async () => {
  ;(fetchPsnTitles as jest.Mock).mockResolvedValue([game(1), game(2, null)])
  expect(await runPsnJob(job('titles', 0))).toEqual([{ phase: 'enrich', priority: 0 }, { phase: 'recent', priority: 0 }])
  expect(fetchPsnEnrichment).not.toHaveBeenCalled()
  expect((await store.loadPsnGames('acc')).map((s) => s.game.id)).toEqual([1, 2])
  expect(await runPsnJob(job('enrich', 0))).toEqual([])
  expect(fetchPsnEnrichment).toHaveBeenCalledTimes(1)
  // The same list again, the enrichment fresh, the year read: nothing to do.
  await store.savePsnGameTrophies('acc', snapOf('acc', game(1)))
  await store.markPsnYearReady('acc')
  expect(await runPsnJob(job('titles', 3))).toEqual([])
})

test('a failed enrichment keeps the list and ends quietly', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetchPsnTitles as jest.Mock).mockResolvedValue([game(1)])
  await runPsnJob(job('titles'))
  ;(fetchPsnEnrichment as jest.Mock).mockRejectedValueOnce(new Error('played list down'))
  expect(await runPsnJob(job('enrich'))).toEqual([])
  expect((await store.loadPsnGames('acc')).length).toBe(1)
  ;(console.error as jest.Mock).mockRestore()
})

test('recent: 20 of the year a job, queued again while some are left; then history and the score', async () => {
  const many = Array.from({ length: CHUNK + 5 }, (_, i) => game(i + 1))
  await store.savePsnTitles('acc', [...many, game(99, '2001-01-01T00:00:00Z')])
  expect(await runPsnJob(job('recent', 2))).toEqual([{ phase: 'recent', priority: 2 }])
  expect(fetchPsnGame).toHaveBeenCalledTimes(CHUNK)
  expect(await runPsnJob(job('recent', 2))).toEqual([{ phase: 'history', priority: 4 }])
  expect((await store.loadPsnPlayer('acc'))!.yearAt).not.toBeNull()
  expect(await runPsnJob(job('history', 4))).toEqual([{ phase: 'score', priority: 5 }])
  expect(fetchPsnGame).toHaveBeenCalledTimes(CHUNK + 6)
})

test('a game that fails keeps the others stored and fails the job (tried again later)', async () => {
  await store.savePsnTitles('acc', [game(1), game(2)])
  ;(fetchPsnGame as jest.Mock).mockImplementation(async (acc: string, g: ReturnType<typeof game>) => {
    if (g.id === 2) throw new PsnBusyError()
    return snapOf(acc, g)
  })
  await expect(runPsnJob(job('recent'))).rejects.toBeInstanceOf(PsnBusyError)
  expect((await store.psnDeltaCount('acc', '2000')).total).toBe(1)
})

test('score: from the store; a pass already running is waited out', async () => {
  expect(await runPsnJob(job('score', 5))).toEqual([])
  expect(runScoreAfterSync).toHaveBeenCalledWith(7)
  ;(runScoreAfterSync as jest.Mock).mockResolvedValueOnce(false)
  expect(await runPsnJob(job('score', 5))).toEqual([{ phase: 'score', priority: 5, delayMs: 120_000 }])
})

test('linking reads the summary now and keeps the reader language for the first sync', async () => {
  await readPsnOnLink('acc', 'es-ES')
  expect(fetchPsnSummary).toHaveBeenCalledWith('acc', null)
  expect(await store.loadPsnPlayer('acc')).toMatchObject({ summary: SUMMARY, language: 'es-ES' })
})

test('a kick drains after the answer, one drain at a time per instance', () => {
  kickPsnSync()
  kickPsnSync()
  expect(runLater).toHaveBeenCalledTimes(1)
})
