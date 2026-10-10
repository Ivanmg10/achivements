jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { findPublicUser, findSubject } from './publicUser'

const query = pool.query as jest.Mock
const ROW = { id: 7, username: 'Ivan', avatar: null, description: null, location: 'ES', rausername: 'ivan', steamid: null, psnaccountid: null, hasRaKey: true, profilePublic: true }

beforeEach(() => jest.clearAllMocks())

describe.each([
  ['findPublicUser', findPublicUser],
  ['findSubject', findSubject],
])('%s', (_name, find) => {
  test('finds a user by name in any case, with the name as a bound parameter', async () => {
    query.mockResolvedValue({ rows: [ROW] })
    await expect(find('IVAN')).resolves.toMatchObject({ id: 7, username: 'Ivan' })
    const [sql, params] = query.mock.calls[0]
    expect(sql).toMatch(/LOWER\(username\) = LOWER\(\$1\)/)
    expect(sql).toMatch(/LIMIT 1/)
    expect(params).toEqual(['IVAN'])
  })

  test('a name that looks like SQL is data, never part of the query', async () => {
    query.mockResolvedValue({ rows: [] })
    const evil = "x' OR '1'='1"
    await find(evil)
    expect(query.mock.calls[0][0]).not.toContain(evil)
    expect(query.mock.calls[0][1]).toEqual([evil])
  })

  test('null when nobody has that name', async () => {
    query.mockResolvedValue({ rows: [] })
    await expect(find('nobody')).resolves.toBeNull()
  })

  test('never reads the email, the password hash or the session fields', async () => {
    query.mockResolvedValue({ rows: [] })
    await find('ivan')
    expect(query.mock.calls[0][0]).not.toMatch(/\bemail\b|password|hash|"raUser"/i)
  })

  test('says whether the profile is public and whether an RA key is stored, not the key', async () => {
    query.mockResolvedValue({ rows: [] })
    await find('ivan')
    const sql = query.mock.calls[0][0] as string
    expect(sql).toContain('profile_public AS "profilePublic"')
    expect(sql).toContain('(raid IS NOT NULL) AS "hasRaKey"')
  })

  test('a database failure is thrown, not turned into "no such user"', async () => {
    query.mockRejectedValue(new Error('db down'))
    await expect(find('ivan')).rejects.toThrow('db down')
  })
})

test('the public row has no key in its query, so it can go to a browser', async () => {
  query.mockResolvedValue({ rows: [] })
  await findPublicUser('ivan')
  // "raid" appears only inside the (raid IS NOT NULL) test, never as a selected column.
  const selected = (query.mock.calls[0][0] as string).replace(/\(raid IS NOT NULL\) AS "hasRaKey"/, '')
  expect(selected).not.toMatch(/\braid\b/)
})

test('the subject row does carry the key, for reading their data server-side', async () => {
  query.mockResolvedValue({ rows: [{ ...ROW, raid: 'secret-key' }] })
  await expect(findSubject('ivan')).resolves.toMatchObject({ raid: 'secret-key' })
  const selected = (query.mock.calls[0][0] as string).replace(/\(raid IS NOT NULL\) AS "hasRaKey"/, '')
  expect(selected).toMatch(/\braid\b/)
})
