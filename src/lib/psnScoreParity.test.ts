/**
 * Score parity (#179): Vault Points from the stored snapshot equal Vault Points from the old live path, on a
 * fixture. The live path is what scoreRefresh did before phase 4: Sony's defined trophies merged with the account's
 * earned ones (psnClient's old psnGameTrophies), scored at once. The snapshot path is the real worker (psnSync)
 * storing them (an in-memory store, test-utils/memoryPsn) and the store read back as scoreRefresh's PSN plan reads it.
 * No Sony, no database. If this fails, the snapshot loses something the score reads.
 */
jest.mock('psn-api', () => ({
  exchangeNpssoForAccessCode: jest.fn(async () => 'code'),
  exchangeAccessCodeForAuthTokens: jest.fn(async () => ({ accessToken: 't', refreshToken: 'r', expiresIn: 3600, refreshTokenExpiresIn: 86400 })),
  exchangeRefreshTokenForAuthTokens: jest.fn(),
  makeUniversalSearch: jest.fn(),
  getUserTrophyProfileSummary: jest.fn(async () => ({ trophyLevel: '1', tier: 1, progress: 0, earnedTrophies: { bronze: 1, silver: 0, gold: 0, platinum: 0 } })),
  getProfileFromAccountId: jest.fn(async () => ({ onlineId: 'p', avatars: [] })),
  getUserTitles: jest.fn(),
  getTitleTrophies: jest.fn(),
  getUserTrophiesEarnedForTitle: jest.fn(),
  getUserPlayedGames: jest.fn(async () => ({ titles: [] })),
  getUserTrophiesForSpecificTitle: jest.fn(async () => ({ titles: [] })),
  getTitleTrophyGroups: jest.fn(async () => ({ trophyGroups: [] })),
  getUserTrophyGroupEarningsForTitle: jest.fn(async () => ({ trophyGroups: [] })),
}))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: () => Promise.reject(new Error('no database in this test')) } }))
jest.mock('@/lib/upstreamCount', () => ({ countUpstream: jest.fn() }))
jest.mock('@/lib/attemptLimit', () => ({ reserveAttempt: jest.fn(async () => ({ allowed: true, release: async () => {} })) }))
jest.mock('@/lib/psnAccounts', () => jest.requireActual('@/test-utils/fakePsnAccounts').fakePsnStore)
jest.mock('@/lib/psnMaintenance', () => ({ maybeMaintainPsnPool: jest.fn() }))
jest.mock('@/lib/steamCache', () => jest.requireActual('@/test-utils/memorySteamCache').memorySteamCache)
jest.mock('@/lib/igdbClient', () => ({ igdbConfigured: () => false, igdbPlatforms: () => [], igdbArt: jest.fn() }))
jest.mock('@/lib/runLater', () => ({ runLater: (task: () => Promise<unknown>) => mockQueued.push(task) }))
jest.mock('@/lib/psnStore', () => jest.requireActual('@/test-utils/memoryPsn').memoryPsnStore)
jest.mock('@/lib/psnQueue', () => jest.requireActual('@/test-utils/memoryPsn').memoryPsnQueue)
jest.mock('@/lib/queryRows', () => ({ queryRows: jest.fn(async () => [{ psnaccountid: 'acc' }]) }))
jest.mock('@/lib/scoreRefresh', () => ({ runScoreAfterSync: jest.fn(async () => true) }))

import * as psn from 'psn-api'
import { loadPsnGameTrophies } from '@/lib/psnStore'
import { readPsnOnLink, syncLinkedPsn } from '@/lib/psnSync'
import { psnBaseCompletedAt } from '@/utils/completionDates'
import { scoreGame } from '@/utils/vaultScore'
import { psnScoreInputs } from '@/utils/vaultScoreInputs'
import type { PsnTrophy } from '@/types/psn'

const mockQueued: (() => Promise<unknown>)[] = []
const mock = (fn: unknown) => fn as jest.Mock

type FixtureTrophy = { id: number; type: PsnTrophy['type']; group?: string; earnedAt?: string | null; rate?: string }
type FixtureGame = { id: string; dlc?: boolean; progress: number; trophies: FixtureTrophy[] }

/** Platinums, DLC (complete and not), a trophy earned with no date, rarities missing or odd, a game never started. */
const GAMES: FixtureGame[] = [
  { id: 'NPWR00001_00', progress: 100, trophies: [{ id: 0, type: 'platinum', earnedAt: '2024-03-01T10:00:00Z', rate: '2.1' }, { id: 1, type: 'gold', earnedAt: '2024-02-01T10:00:00Z', rate: '10.5' }, { id: 2, type: 'bronze', earnedAt: '2024-01-01T10:00:00Z', rate: '70' }] },
  { id: 'NPWR00002_00', dlc: true, progress: 90, trophies: [{ id: 0, type: 'platinum', earnedAt: '2021-05-10T10:00:00Z', rate: '1.0' }, { id: 1, type: 'silver', earnedAt: '2021-05-01T10:00:00Z', rate: '30' }, { id: 2, type: 'bronze', group: '001', earnedAt: '2026-03-01T00:00:00Z', rate: '5' }, { id: 3, type: 'gold', group: '001', rate: '0.4' }] },
  { id: 'NPWR00003_00', progress: 40, trophies: [{ id: 0, type: 'bronze', earnedAt: '2025-12-24T20:00:00Z', rate: '' }, { id: 1, type: 'bronze', earnedAt: null, rate: '55.5' }, { id: 2, type: 'silver', rate: 'n/a' }, { id: 3, type: 'gold', rate: '3' }] },
  { id: 'NPWR00004_00', dlc: true, progress: 100, trophies: [{ id: 0, type: 'gold', earnedAt: '2023-07-07T07:00:00Z', rate: '8' }, { id: 1, type: 'bronze', group: '002', earnedAt: '2023-08-08T08:00:00Z', rate: '4' }] },
  { id: 'NPWR00005_00', progress: 0, trophies: [{ id: 0, type: 'bronze', rate: '90' }] },
]

const earnedCount = (g: FixtureGame) => g.trophies.filter((t) => t.earnedAt !== undefined).length
const last = (g: FixtureGame) => g.trophies.map((t) => t.earnedAt ?? '').sort().at(-1) || null
const counts = (list: FixtureTrophy[]) => ({
  bronze: list.filter((t) => t.type === 'bronze').length,
  silver: list.filter((t) => t.type === 'silver').length,
  gold: list.filter((t) => t.type === 'gold').length,
  platinum: list.filter((t) => t.type === 'platinum').length,
})

function installSony() {
  const byId = new Map(GAMES.map((g) => [g.id, g]))
  mock(psn.getUserTitles).mockResolvedValue({
    trophyTitles: GAMES.map((g) => ({
      npCommunicationId: g.id,
      npServiceName: 'trophy2',
      trophyTitleName: g.id,
      trophyTitleIconUrl: 'https://img/x.png',
      trophyTitlePlatform: 'PS5',
      definedTrophies: counts(g.trophies),
      earnedTrophies: counts(g.trophies.filter((t) => t.earnedAt !== undefined)),
      progress: g.progress,
      lastUpdatedDateTime: earnedCount(g) ? (last(g) ?? '2020-01-01T00:00:00Z') : undefined,
      hasTrophyGroups: g.dlc === true,
    })),
  })
  mock(psn.getTitleTrophies).mockImplementation(async (_a: unknown, id: string) => ({
    trophies: byId.get(id)!.trophies.map((t) => ({ trophyId: t.id, trophyType: t.type, trophyName: `T${t.id}`, trophyGroupId: t.group ?? 'default', trophyHidden: false })),
  }))
  mock(psn.getUserTrophiesEarnedForTitle).mockImplementation(async (_a: unknown, _acc: string, id: string) => ({
    trophies: byId.get(id)!.trophies.map((t) => ({ trophyId: t.id, earned: t.earnedAt !== undefined, earnedDateTime: t.earnedAt ?? undefined, trophyEarnedRate: t.rate })),
  }))
}

/** The old live path, as psnClient.psnGameTrophies merged the two halves before #179. */
async function livePath(titleId: string): Promise<PsnTrophy[]> {
  const defs = (await mock(psn.getTitleTrophies)(null, titleId)).trophies as Array<{ trophyId: number; trophyType: PsnTrophy['type']; trophyName: string; trophyGroupId: string; trophyHidden: boolean }>
  const earned = (await mock(psn.getUserTrophiesEarnedForTitle)(null, 'acc', titleId)).trophies as Array<{ trophyId: number; earned: boolean; earnedDateTime?: string; trophyEarnedRate?: string }>
  const mine = new Map(earned.map((t) => {
    const rate = Number(t.trophyEarnedRate)
    return [t.trophyId, { id: t.trophyId, earned: t.earned === true, earnedAt: t.earnedDateTime ?? null, rarity: t.trophyEarnedRate && Number.isFinite(rate) ? rate : null }]
  }))
  return defs.map((t) => ({ id: t.trophyId, name: t.trophyName, detail: '', iconUrl: null, type: t.trophyType, groupId: t.trophyGroupId, hidden: t.trophyHidden, earned: false, earnedAt: null, rarity: null, ...mine.get(t.trophyId) }))
}

const score = (trophies: PsnTrophy[]) => scoreGame(psnScoreInputs(trophies), undefined, psnBaseCompletedAt(trophies))

test('every started game scores the same from the snapshot as from the live path', async () => {
  process.env.PSN_NPSSO = 'npsso'
  installSony()
  await readPsnOnLink('acc')
  await syncLinkedPsn(7)
  while (mockQueued.length) await mockQueued.shift()!()

  const started = GAMES.filter((g) => earnedCount(g) > 0)
  expect(started).toHaveLength(4)
  for (const g of started) {
    const stored = await loadPsnGameTrophies('acc', g.id, 'en-US')
    expect(stored).not.toBeNull()
    const live = await livePath(g.id)
    expect({ id: g.id, ...score(stored!.trophies) }).toEqual({ id: g.id, ...score(live) })
    expect(score(live).points).toBeGreaterThan(0)
  }
  // The completion bonus stays on the old platinum day when a later DLC trophy lands.
  expect(psnBaseCompletedAt((await loadPsnGameTrophies('acc', 'NPWR00002_00', 'en-US'))!.trophies)).toBe('2021-05-10T10:00:00Z')
})
