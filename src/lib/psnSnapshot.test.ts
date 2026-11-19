/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnStore', () => jest.requireActual('@/test-utils/memoryPsn').memoryPsnStore)
jest.mock('@/lib/psnQueue', () => jest.requireActual('@/test-utils/memoryPsn').memoryPsnQueue)
jest.mock('@/lib/psnSync', () => ({ requestPsnSync: jest.fn(), yearStart: () => '2025-11-14T00:00:00.000Z' }))
jest.mock('@/lib/wantsFresh', () => ({ wantsFresh: jest.fn(async () => false) }))
jest.mock('@/lib/psnAccounts', () => ({ psnUsableRate: jest.fn(async () => 40) }))

import { memoryPsnStore as store } from '@/test-utils/memoryPsn'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { requestPsnSync } from '@/lib/psnSync'
import { wantsFresh } from '@/lib/wantsFresh'
import { findPsnGame, psnGame, psnLatestTrophies, psnLibrary, psnRecentTrophies, psnSummary, psnSyncState, REFRESH_MS, SYNC_EVERY_MS } from './psnSnapshot'
import type { PsnSummaryCore } from './psnStore'

const NOW = Date.UTC(2026, 10, 14, 12)
const SUMMARY: PsnSummaryCore = { onlineId: 'p', avatarUrl: null, aboutMe: '', isPlus: false, trophyLevel: 1, tier: 1, levelProgress: 0, earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 } }
const started = psnGameFixture({ titleId: 'NPWR00001_00', id: 100, numAwarded: 1, lastTrophyAt: '2026-11-10T00:00:00Z', earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 } })
const untouched = psnGameFixture({ titleId: 'NPWR00002_00', id: 200 })
const DEFS = [{ id: 0, name: 'Uno', detail: 'd', iconUrl: null, type: 'bronze' as const, groupId: 'default', hidden: false }]

let clock = NOW
async function linked() {
  await store.savePsnSummary('acc', SUMMARY, true)
  await store.savePsnTitles('acc', [started, untouched])
}
async function readGame(language = 'es-ES') {
  await store.savePsnGameTrophies('acc', { titleId: started.titleId, lastTrophyAt: started.lastTrophyAt, language, defined: DEFS, earned: [{ id: 0, earnedAt: '2026-11-10T00:00:00Z' }], rarity: [{ id: 0, rarity: 4 }], groupDefs: null, groupsEarned: null, completedAt: null })
}

beforeEach(() => {
  store.clear()
  jest.clearAllMocks()
  clock = NOW
  jest.spyOn(Date, 'now').mockImplementation(() => clock)
})
afterEach(() => jest.restoreAllMocks())

test('nothing stored: 202 for every reader, and a first sync is queued', async () => {
  await expect(psnSummary('acc', '7')).rejects.toThrow('syncing')
  expect(requestPsnSync).toHaveBeenCalledWith('7', 2, 'summary')
  // Linked a moment ago: the summary is there, the list is what is asked for.
  await store.savePsnSummary('acc', SUMMARY, true)
  await expect(psnLibrary('acc', '7')).rejects.toThrow('syncing')
  expect(requestPsnSync).toHaveBeenLastCalledWith('7', 2, 'titles')
})

test('the summary from the store, with the game count and when Sony was last checked; no sync while it is fresh', async () => {
  await linked()
  expect(await psnSummary('acc', '7')).toEqual({ ...SUMMARY, games: 2, syncedAt: NOW, nextSyncAt: NOW + REFRESH_MS })
  expect(requestPsnSync).not.toHaveBeenCalled()
})

test('older than 15 minutes: answered as stored, a sync queued after; the refresh button makes it manual', async () => {
  await linked()
  clock += SYNC_EVERY_MS
  await psnSummary('acc', '7')
  expect(requestPsnSync).toHaveBeenCalledWith('7', 3)
  clock = NOW + REFRESH_MS
  ;(wantsFresh as jest.Mock).mockResolvedValueOnce(true)
  await psnSummary('acc', '7')
  expect(requestPsnSync).toHaveBeenLastCalledWith('7', 1)
})

test('a hidden profile answers as Sony would (403)', async () => {
  await linked()
  await store.markPsnPrivate('acc')
  await expect(psnLibrary('acc', '7')).rejects.toMatchObject({ isPrivate: true })
})

test('the library lays the stored completion date on a complete game with DLC', async () => {
  const dlc = psnGameFixture({ titleId: 'NPWR00003_00', id: 300, hasDlc: true, pctWon: 100, numAwarded: 1, lastTrophyAt: '2026-01-01T00:00:00Z' })
  await store.savePsnSummary('acc', SUMMARY, true)
  await store.savePsnTitles('acc', [dlc])
  await store.savePsnGameTrophies('acc', { titleId: dlc.titleId, lastTrophyAt: dlc.lastTrophyAt, language: 'en-US', defined: DEFS, earned: [], rarity: [], groupDefs: null, groupsEarned: null, completedAt: '2025-01-01T00:00:00Z' })
  expect((await psnLibrary('acc', '7'))[0].completedAt).toBe('2025-01-01T00:00:00Z')
  expect(await findPsnGame('acc', 'NPWR00003_00', '7')).toMatchObject({ id: 300 })
  expect(await findPsnGame('acc', 'NPWR09999_00', '7')).toBeNull()
})

test('a game page: 202 and first in the queue until its trophies are read; then the stored ones, in the language', async () => {
  await linked()
  await expect(psnGame('acc', started.titleId, '7', 'es-ES')).rejects.toThrow('syncing')
  expect(requestPsnSync).toHaveBeenCalledWith('7', 1, 'history')
  expect((await store.psnDeltaGames('acc', '2000', 'rest', 5)).map((d) => d.game.titleId)).toContain(started.titleId)
  await readGame()
  ;(requestPsnSync as jest.Mock).mockClear()
  const game = await psnGame('acc', started.titleId, '7', 'es-ES')
  expect(game!.trophies).toEqual([{ ...DEFS[0], earned: true, earnedAt: '2026-11-10T00:00:00Z', rarity: 4 }])
  expect(game!.groups).toEqual([expect.objectContaining({ id: 'default', name: 'Game' })])
  expect(requestPsnSync).not.toHaveBeenCalled()
  expect(await psnGame('acc', 'NPWR09999_00', '7', 'es-ES')).toBeNull()
})

test('a game read in another language is answered as stored and asked for in the new one', async () => {
  await linked()
  await readGame('en-US')
  const game = await psnGame('acc', started.titleId, '7', 'es-ES')
  expect(game!.trophies[0].name).toBe('Uno')
  expect(requestPsnSync).toHaveBeenCalledWith('7', 1, 'history')
  expect((await store.loadPsnPlayer('acc'))!.language).toBe('es-ES')
})

test('the latest trophies: 202 until the latest games are read; the year: 202 until it is first whole', async () => {
  await linked()
  await expect(psnLatestTrophies('acc', '7', 'es-ES')).rejects.toThrow('syncing')
  await readGame()
  expect((await psnLatestTrophies('acc', '7', 'es-ES')).map((t) => t.trophyId)).toEqual([0])
  await expect(psnRecentTrophies('acc', 60, '7', 'es-ES')).rejects.toThrow('syncing')
  expect(requestPsnSync).toHaveBeenLastCalledWith('7', 2, 'recent')
  await store.markPsnYearReady('acc')
  expect(await psnRecentTrophies('acc', 60, '7', 'es-ES')).toEqual([expect.objectContaining({ gameId: 100, name: 'Uno', earnedAt: '2026-11-10T00:00:00Z' })])
  // Cut to the window.
  expect(await psnRecentTrophies('acc', 1, '7', 'es-ES')).toEqual([])
})

test('the sync state: new, syncing with its jobs, ready, private; it queues nothing', async () => {
  expect(await psnSyncState('acc', '7')).toMatchObject({ state: 'new', syncedAt: null, yearReady: false })
  await linked()
  expect(await psnSyncState('acc', '7')).toMatchObject({ state: 'ready', syncedAt: NOW, nextSyncAt: NOW + REFRESH_MS, pending: { year: 1, total: 1 } })
  const { memoryPsnQueue } = jest.requireActual('@/test-utils/memoryPsn')
  await memoryPsnQueue.enqueuePsn(7, 'recent', 2)
  expect(await psnSyncState('acc', '7')).toMatchObject({ state: 'syncing', jobs: [{ phase: 'recent', status: 'queued' }] })
  // What it means to a person (#180): the list is there, the year is being read.
  expect(await psnSyncState('acc', '7')).toMatchObject({ stage: 'ready_partial', steps: { library: 'done', history: 'active' }, trouble: null })
  await store.markPsnPrivate('acc')
  expect((await psnSyncState('acc', '7')).state).toBe('private')
  expect(requestPsnSync).not.toHaveBeenCalled()
  memoryPsnQueue.clear()
})
