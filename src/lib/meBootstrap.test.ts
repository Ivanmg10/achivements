jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/vaultMe', () => ({ loadVaultMe: jest.fn() }))

import pool from '@/lib/db'
import { loadVaultMe } from '@/lib/vaultMe'
import { loadBootstrap } from './meBootstrap'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  query.mockImplementation(async (sql: string) =>
    sql.includes('FROM users')
      ? { rows: [{ preferences: { 'home-layout': 'cover', 'not-synced': 'x' } }] }
      : { rows: [{ source: 'ra', game_id: 5, title: 'Zelda', image: null }] },
  )
  ;(loadVaultMe as jest.Mock).mockResolvedValue({ points: 10 })
})

test('reads the three parts from the database, only the synced preferences', async () => {
  expect(await loadBootstrap('7', false)).toEqual({
    preferences: { 'home-layout': 'cover' },
    hiddenGames: [{ source: 'ra', game_id: 5, title: 'Zelda', image: null }],
    vault: { points: 10 },
  })
  expect(loadVaultMe).toHaveBeenCalledWith(7, false)
})

test('a part that fails is null; the others still come', async () => {
  ;(loadVaultMe as jest.Mock).mockRejectedValue(new Error('db'))
  const boot = await loadBootstrap('7', true)
  expect(boot.vault).toBeNull()
  expect(boot.preferences).toEqual({ 'home-layout': 'cover' })
  expect(console.error).toHaveBeenCalledWith('[me/bootstrap] vault', expect.any(Error))
})
