jest.mock('@/lib/apiAuth', () => ({ dataOwner: jest.fn() }))
jest.mock('@/lib/publicUser', () => ({ findPublicUser: jest.fn(), hiddenGameKeys: jest.fn() }))
jest.mock('@/lib/groupList', () => ({ listGroups: jest.fn() }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/rankings', () => ({ vaultTotalsOrNone: jest.fn(async (ids: number[]) => new Map(ids.map((id) => [id, 1234]))) }))

import { GET } from './route'
import { dataOwner } from '@/lib/apiAuth'
import { findPublicUser, hiddenGameKeys } from '@/lib/publicUser'
import { listGroups } from '@/lib/groupList'
import pool from '@/lib/db'

const get = (username = 'ivan') =>
  GET({} as Request, { params: Promise.resolve({ username }) })

const ROW = {
  id: 7, username: 'ivan', avatar: 'https://x/a.png', description: 'Hi', location: 'ES',
  rausername: 'IvanRA', steamid: '765', psnaccountid: null, hasRaKey: false, profilePublic: true,
  steamusername: 'ivan_st', psnusername: 'stale', theme: 'dark', gender: 'male', genderPublic: false,
  favorite_game: { id: 1, title: 'Zelda', imageIcon: '/i.png' }, favorite_steam_game: null, favorite_psn_game: null,
}
const GROUP = { id: 3, title: 'RPGs', is_public: true }

beforeEach(() => {
  jest.clearAllMocks()
  ;(dataOwner as jest.Mock).mockResolvedValue({ id: '1', raid: 'my-key' })
  ;(findPublicUser as jest.Mock).mockResolvedValue(ROW)
  ;(hiddenGameKeys as jest.Mock).mockResolvedValue(['ra:9'])
  ;(listGroups as jest.Mock).mockResolvedValue([GROUP])
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

const body = async (res: Promise<unknown>) => ((await res) as { data: Record<string, unknown> }).data

test('signed-out visitors get the auth answer', async () => {
  ;(dataOwner as jest.Mock).mockResolvedValue(null)
  expect((await get()).status).toBe(401)
  expect(findPublicUser).not.toHaveBeenCalled()
})

test('returns who they are and which platforms they have, and nothing private', async () => {
  const res = await get('Ivan')
  expect(res.status).toBe(200)
  expect(findPublicUser).toHaveBeenCalledWith('Ivan')
  expect((res as unknown as { data: unknown }).data).toEqual({
    username: 'ivan', avatar: 'https://x/a.png', description: 'Hi', location: 'ES', ra: 'IvanRA', steam: true, psn: false, xbox: false,
    // A PSN name with no linked account is a leftover, not a link.
    steamName: 'ivan_st', psnName: null, xboxName: null, isSelf: false, theme: 'dark', gender: null,
    favorites: { ra: ROW.favorite_game, steam: null, psn: null, xbox: null },
    hiddenGames: ['ra:9'], groups: [GROUP], following: false, vaultPoints: 1234,
  })
})

test('only their public groups are listed', async () => {
  await get()
  expect(listGroups).toHaveBeenCalledWith(7, { publicOnly: true, xbox: false })
})

test('the gender is shown only when they chose to show it', async () => {
  expect((await body(get())).gender).toBeNull()
  ;(findPublicUser as jest.Mock).mockResolvedValue({ ...ROW, genderPublic: true })
  expect((await body(get())).gender).toBe('male')
})

test('tells the owner it is their own page', async () => {
  ;(dataOwner as jest.Mock).mockResolvedValue({ id: '7' })
  expect((await body(get())).isSelf).toBe(true)
})

test('an unknown user is a 404', async () => {
  ;(findPublicUser as jest.Mock).mockResolvedValue(null)
  expect((await get('nobody')).status).toBe(404)
})

test('a failing lookup is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(findPublicUser as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await get()).status).toBe(500)
})

test('RA is offered when the viewer has a key, or the user has one of their own', async () => {
  ;(dataOwner as jest.Mock).mockResolvedValue({ id: '1', raid: 'my-key' })
  expect(((await get()) as unknown as { data: { ra: string } }).data.ra).toBe('IvanRA')
  ;(dataOwner as jest.Mock).mockResolvedValue({ id: '1' })
  ;(findPublicUser as jest.Mock).mockResolvedValue({ ...ROW, hasRaKey: true })
  expect(((await get()) as unknown as { data: { ra: string } }).data.ra).toBe('IvanRA')
})

test('RA is not offered when nobody could read it', async () => {
  ;(dataOwner as jest.Mock).mockResolvedValue({ id: '1' })
  expect(((await get()) as unknown as { data: { ra: string | null } }).data.ra).toBeNull()
})

describe('a private profile', () => {
  beforeEach(() => (findPublicUser as jest.Mock).mockResolvedValue({ ...ROW, profilePublic: false }))

  test('looks like no profile at all to anyone else', async () => {
    expect((await get()).status).toBe(404)
  })

  test('is still there for its owner', async () => {
    ;(dataOwner as jest.Mock).mockResolvedValue({ id: '7', raid: 'my-key' })
    expect((await get()).status).toBe(200)
  })
})

test('says whether the viewer follows them', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })
  expect((await body(get())).following).toBe(true)
  expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['1', 7])
})

describe('Xbox is admin-only', () => {
  const WITH_XBOX = { ...ROW, xboxxuid: '25354', xboxgamertag: 'TestPlayer', favorite_xbox_game: { id: 1, title: 'Halo', imageIcon: '' } }

  test('to a viewer who is not an admin it is not there at all', async () => {
    ;(findPublicUser as jest.Mock).mockResolvedValue(WITH_XBOX)
    const data = await body(get())
    expect(data.xbox).toBe(false)
    expect(data.xboxName).toBeNull()
    expect((data.favorites as Record<string, unknown>).xbox).toBeNull()
    expect(listGroups).toHaveBeenCalledWith(7, { publicOnly: true, xbox: false })
  })

  test('their hidden Xbox games are left out for a viewer who is not an admin', async () => {
    ;(hiddenGameKeys as jest.Mock).mockResolvedValue(['ra:9', 'xbox:12'])
    expect((await body(get())).hiddenGames).toEqual(['ra:9'])
    ;(dataOwner as jest.Mock).mockResolvedValue({ id: '1', admin: true })
    expect((await body(get())).hiddenGames).toEqual(['ra:9', 'xbox:12'])
  })

  test('an admin viewer sees the account, its name, its favourite and its groups', async () => {
    ;(dataOwner as jest.Mock).mockResolvedValue({ id: '1', raid: 'my-key', admin: true })
    ;(findPublicUser as jest.Mock).mockResolvedValue(WITH_XBOX)
    const data = await body(get())
    expect(data.xbox).toBe(true)
    expect(data.xboxName).toBe('TestPlayer')
    expect((data.favorites as Record<string, unknown>).xbox).toEqual(WITH_XBOX.favorite_xbox_game)
    expect(listGroups).toHaveBeenCalledWith(7, { publicOnly: true, xbox: true })
  })

  test('a user with no Xbox account has none, even for an admin', async () => {
    ;(dataOwner as jest.Mock).mockResolvedValue({ id: '1', admin: true })
    ;(findPublicUser as jest.Mock).mockResolvedValue({ ...ROW, xboxxuid: null, xboxgamertag: 'stale' })
    const data = await body(get())
    expect(data.xbox).toBe(false)
    expect(data.xboxName).toBeNull()
  })
})

test('whether they are online, and when they were last seen, as the query gives it', async () => {
  ;(findPublicUser as jest.Mock).mockResolvedValue({ ...ROW, online: false, lastSeenAt: '2026-10-19T10:00:00Z' })
  const data = await body(get())
  expect(data.online).toBe(false)
  expect(data.lastSeenAt).toBe('2026-10-19T10:00:00Z')
})
