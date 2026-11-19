/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn(), connect: jest.fn() } }))

import pool from '@/lib/db'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { loadPsnEarnedSince, loadPsnGameTrophies, loadPsnPlayer, MAX_GAMES, psnDeltaGames, savePsnGameTrophies, savePsnTitles } from './psnStore'

const query = pool.query as jest.Mock
const client = { query: jest.fn(), release: jest.fn() }
const clientSql = () => client.query.mock.calls.map((c) => String(c[0]))

beforeEach(() => {
  jest.clearAllMocks()
  query.mockResolvedValue({ rows: [] })
  client.query.mockResolvedValue({ rows: [] })
  ;(pool.connect as jest.Mock).mockResolvedValue(client)
})

test('a player row in the app shape, with its game count; none is null', async () => {
  query.mockResolvedValueOnce({ rows: [{ account_id: 'acc', summary: null, summary_at: new Date(1000), profile_at: null, titles_at: null, enrichment: null, enriched_at: null, year_at: null, language: 'es-ES', state: 'ok', games: 3 }] })
  expect(await loadPsnPlayer('acc')).toEqual({ accountId: 'acc', summary: null, summaryAt: 1000, profileAt: null, titlesAt: null, enrichment: null, enrichedAt: null, yearAt: null, language: 'es-ES', state: 'ok', games: 3 })
  expect(await loadPsnPlayer('nobody')).toBeNull()
})

test('the list in one transaction: the shared sets, the player rows, the games no longer listed dropped; capped', async () => {
  const games = Array.from({ length: MAX_GAMES + 2 }, (_, i) => psnGameFixture({ titleId: `NPWR${10000 + i}_00` }))
  await savePsnTitles('acc', games)
  const statements = clientSql()
  expect(statements[0]).toBe('BEGIN')
  expect(statements.some((s) => s.includes('INSERT INTO psn_games'))).toBe(true)
  expect(statements.some((s) => s.includes('INSERT INTO psn_player_games'))).toBe(true)
  const drop = client.query.mock.calls.find((c) => String(c[0]).includes('DELETE FROM psn_player_games'))!
  expect(drop[1][1]).toHaveLength(MAX_GAMES)
  expect(statements.at(-1)).toBe('COMMIT')
  expect(client.release).toHaveBeenCalled()
})

test('a failed write rolls back and releases the connection', async () => {
  client.query.mockImplementation(async (sql: string) => {
    if (sql.includes('INSERT INTO psn_games')) throw new Error('db')
    return { rows: [] }
  })
  await expect(savePsnTitles('acc', [psnGameFixture()])).rejects.toThrow('db')
  expect(clientSql()).toContain('ROLLBACK')
  expect(client.release).toHaveBeenCalled()
})

test("a game's trophies: texts merged per language, rarity everyone's, only earned rows the player's, the game marked read", async () => {
  await savePsnGameTrophies('acc', {
    titleId: 'NPWR00001_00', lastTrophyAt: '2026-01-01', language: 'es-ES',
    defined: [{ id: 0, name: 'Uno', detail: 'd', iconUrl: null, type: 'bronze', groupId: 'default', hidden: false }],
    earned: [{ id: 0, earnedAt: '2026-01-01' }], rarity: [{ id: 0, rarity: 3 }], groupDefs: null, groupsEarned: null, completedAt: null,
  })
  const statements = clientSql()
  expect(statements.find((s) => s.includes('INSERT INTO psn_trophies'))).toContain('texts = psn_trophies.texts || EXCLUDED.texts')
  expect(statements.find((s) => s.includes('UPDATE psn_games SET languages'))).toBeDefined()
  expect(statements.find((s) => s.includes('DELETE FROM psn_player_trophies'))).toBeDefined()
  const read = client.query.mock.calls.find((c) => String(c[0]).includes('SET trophies_at = $3'))!
  expect(String(read[0])).toContain('wanted_at = NULL')
  expect(read[1]).toEqual(['acc', 'NPWR00001_00', '2026-01-01', null, null])
})

test('the delta: what moved or was asked for, wanted first, the year apart from the rest', async () => {
  await psnDeltaGames('acc', '2025-11-14', 'year', 20)
  await psnDeltaGames('acc', '2025-11-14', 'rest', 20)
  const [year, rest] = query.mock.calls.map((c) => String(c[0]))
  expect(year).toContain('p.trophies_at IS DISTINCT FROM p.last_trophy_at OR p.wanted_at IS NOT NULL) AND p.last_trophy_at >= $2')
  expect(rest).toContain('p.wanted_at IS NOT NULL OR (p.trophies_at IS DISTINCT FROM p.last_trophy_at AND (p.last_trophy_at < $2')
  expect(year).toContain('ORDER BY p.wanted_at IS NULL, p.last_trophy_at DESC')
})

test("a game's trophies in the asked language, else English, else any; null when never read", async () => {
  const game = psnGameFixture({ title: 'G' })
  query
    .mockResolvedValueOnce({ rows: [{ trophy_id: 0, type: 'gold', group_id: 'default', hidden: false, icon_url: null, rarity: 2, text: ['Oro', 'det'], earned: true, earned_at: '2026-01-01' }] })
    .mockResolvedValueOnce({ rows: [{ languages: ['es-ES'], group_defs: null, groups: null, game, trophies_at: '2026-01-01' }] })
  const read = await loadPsnGameTrophies('acc', 'NPWR00001_00', 'fr-FR')
  expect(String(query.mock.calls[0][0])).toContain("COALESCE(t.texts->$3, t.texts->'en-US'")
  expect(read).toEqual({
    trophies: [{ id: 0, name: 'Oro', detail: 'det', iconUrl: null, type: 'gold', groupId: 'default', hidden: false, earned: true, earnedAt: '2026-01-01', rarity: 2 }],
    groups: [expect.objectContaining({ id: 'default', name: 'G' })],
    languages: ['es-ES'],
    trophiesAt: '2026-01-01',
  })
  query.mockResolvedValue({ rows: [] })
  expect(await loadPsnGameTrophies('acc', 'NPWR00001_00', 'fr-FR')).toBeNull()
})

test('trophies earned since a date, with their game', async () => {
  query.mockResolvedValueOnce({ rows: [{ game: psnGameFixture({ id: 5, titleId: 'NPWR00005_00', title: 'Five' }), trophy_id: 1, type: 'bronze', icon_url: null, rarity: null, text: ['B', ''], earned_at: '2026-11-01' }] })
  expect(await loadPsnEarnedSince('acc', '2026-10-01', 'en-US', ['NPWR00005_00'])).toEqual([
    { gameId: 5, titleId: 'NPWR00005_00', gameTitle: 'Five', gameIconUrl: '', trophyId: 1, name: 'B', iconUrl: null, type: 'bronze', earnedAt: '2026-11-01', rarity: null },
  ])
  expect(query.mock.calls[0][1]).toEqual(['acc', '2026-10-01', 'en-US', ['NPWR00005_00']])
})
