/**
 * @jest-environment node
 */
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/publicUser', () => ({ findSubject: jest.fn() }))

import fs from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { dataOwner, requireRaSession, requireSteamSession, requirePsnSession } from './apiAuth'
import { findSubject } from '@/lib/publicUser'

const ME = { id: '1', rausername: 'MeRA', raid: 'my-key', steamid: '111', psnaccountid: 'psn-me' }
const BOB = { id: 7, username: 'bob', rausername: 'BobRA', raid: 'bob-key', steamid: '765', psnaccountid: null, profilePublic: true }
const req = (query = '', method = 'GET') => ({ url: `http://localhost/api/x${query}`, method }) as unknown as Request

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'steam-key'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: ME })
  ;(findSubject as jest.Mock).mockResolvedValue(BOB)
})

describe('dataOwner', () => {
  test('is the signed-in user without a `user` parameter', async () => {
    expect(await dataOwner(req())).toBe(ME)
    expect(await dataOwner()).toBe(ME)
    expect(findSubject).not.toHaveBeenCalled()
  })

  test('is nobody when signed out', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect(await dataOwner(req('?user=bob'))).toBeNull()
  })

  test('is the named user on a GET, read with the VIEWER\'s RA key when they have one', async () => {
    expect(await dataOwner(req('?user=bob'))).toEqual({
      id: '7', rausername: 'BobRA', raid: 'my-key', steamid: '765', psnaccountid: undefined,
    })
    expect(findSubject).toHaveBeenCalledWith('bob')
  })

  test.each(['POST', 'PUT', 'DELETE', 'PATCH'])('a %s can never name another user', async (method) => {
    expect(await dataOwner(req('?user=bob', method))).toBe(ME)
    expect(findSubject).not.toHaveBeenCalled()
  })

  test('is nobody for a user that does not exist, never falling back to the viewer', async () => {
    ;(findSubject as jest.Mock).mockResolvedValue(null)
    expect(await dataOwner(req('?user=ghost'))).toBeNull()
  })

  test('a viewer with no RA key of their own reads it with the user\'s own', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    expect((await dataOwner(req('?user=bob')))?.raid).toBe('bob-key')
    const ra = await requireRaSession(req('?user=bob'))
    expect(ra).toEqual({ ok: true, session: { id: '7', rausername: 'BobRA', raid: 'bob-key' } })
  })

  test('with no key on either side there is nothing to read RA with', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    ;(findSubject as jest.Mock).mockResolvedValue({ ...BOB, raid: null })
    expect((await requireRaSession(req('?user=bob'))).ok).toBe(false)
  })

  test('the user\'s own key is never used for their own session, only on someone\'s behalf', async () => {
    expect((await dataOwner(req()))?.raid).toBe('my-key')
  })
})

describe('a private profile', () => {
  beforeEach(() => (findSubject as jest.Mock).mockResolvedValue({ ...BOB, profilePublic: false }))

  test('cannot be read by anyone else, however it is asked for', async () => {
    expect(await dataOwner(req('?user=bob'))).toBeNull()
    expect((await requireRaSession(req('?user=bob'))).ok).toBe(false)
    expect((await requireSteamSession(req('?user=bob'))).ok).toBe(false)
    expect((await requirePsnSession(req('?user=bob'))).ok).toBe(false)
  })

  test('can be read by its owner', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { ...ME, id: '7' } })
    expect((await dataOwner(req('?user=bob')))?.id).toBe('7')
  })
})

describe('the platform helpers follow it', () => {
  test('RA: the other user\'s name and the viewer\'s key', async () => {
    const r = await requireRaSession(req('?user=bob'))
    expect(r).toEqual({ ok: true, session: { id: '7', rausername: 'BobRA', raid: 'my-key' } })
  })

  test('Steam: the other user\'s account and the app key', async () => {
    const r = await requireSteamSession(req('?user=bob'))
    expect(r).toEqual({ ok: true, session: { id: '7', steamid: '765', apiKey: 'steam-key' } })
  })

  test('PSN: a user with none linked is a 400, not the viewer\'s own', async () => {
    const r = await requirePsnSession(req('?user=bob'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.response.status).toBe(400)
  })
})

/**
 * dataOwner lets a request name another user, which is only safe for reads.
 * The method check inside it is one lock; this is the other: no POST, PUT,
 * PATCH or DELETE handler may call it.
 */
test('no write handler can answer for another user', () => {
  const root = path.join(process.cwd(), 'src/app/api')
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === 'route.ts') {
        const src = fs.readFileSync(full, 'utf8')
        // Each handler on its own: a route may read through dataOwner in GET and still write for itself in PUT.
        const handlers = src.split(/(?=export async function )/).slice(1)
        for (const h of handlers) {
          const isWrite = /^export async function (POST|PUT|PATCH|DELETE)/.test(h)
          if (isWrite && /dataOwner\(|require(Ra|Steam|Psn)Session\(/.test(h)) offenders.push(path.relative(root, full))
        }
      }
    }
  }
  walk(root)
  expect(offenders).toEqual([])
})
