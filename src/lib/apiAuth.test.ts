jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

import { getServerSession } from 'next-auth'
import { requireRaSession, requireViewerApiKey, requireSession, requireSteamSession, requireXboxSession, requireXboxUser } from './apiAuth'

beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.RA_API_KEY
  delete process.env.STEAM_API_KEY
})

describe('requireSession', () => {
  test('returns 401 when there is no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const result = await requireSession()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  test('returns the user id when signed in, regardless of RA linkage', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    const result = await requireSession()
    expect(result).toEqual({ ok: true, id: '1' })
  })
})

describe('requireRaSession', () => {
  test('returns 401 when there is no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const result = await requireRaSession()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  test('returns 400 when signed in but no RA account linked', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    const result = await requireRaSession()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(400)
  })

  test('returns the session data when an RA account is linked', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: '1', rausername: 'ivan', raid: 'key' },
    })
    const result = await requireRaSession()
    expect(result).toEqual({ ok: true, session: { id: '1', rausername: 'ivan', raid: 'key' } })
  })
})

describe('requireViewerApiKey', () => {
  test('returns 401 when there is no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const result = await requireViewerApiKey()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  test('uses the viewer own raid when present', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', raid: 'my-key' } })
    const result = await requireViewerApiKey()
    expect(result).toEqual({ ok: true, viewerId: '1', apiKey: 'my-key' })
  })

  test('never falls back to a shared key: no RA account, no RA data', async () => {
    process.env.RA_API_KEY = 'shared-key'
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    const result = await requireViewerApiKey()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(400)
  })
})

describe('requireSteamSession', () => {
  beforeEach(() => {
    process.env.STEAM_API_KEY = 'steam-key'
  })

  test('returns 401 when there is no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const result = await requireSteamSession()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  test('returns 400 when signed in but no Steam account linked', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    const result = await requireSteamSession()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(400)
  })

  test('returns 503 when the app has no Steam API key — our problem, not the user’s', async () => {
    delete process.env.STEAM_API_KEY
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', steamid: '765' } })
    const result = await requireSteamSession()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(503)
  })

  test('treats a blank API key as missing', async () => {
    process.env.STEAM_API_KEY = '   '
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', steamid: '765' } })
    const result = await requireSteamSession()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(503)
  })

  test('returns the session and app key when linked', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', steamid: '765' } })
    const result = await requireSteamSession()
    expect(result).toEqual({ ok: true, session: { id: '1', steamid: '765', apiKey: 'steam-key' } })
  })
})

describe('requireXboxUser', () => {
  const status = (r: Awaited<ReturnType<typeof requireXboxUser>>) => (r.ok ? 200 : (r.response as unknown as { status: number }).status)

  test('401 when there is no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect(status(await requireXboxUser())).toBe(401)
  })

  test('403 for a user who is not an admin: Xbox is not theirs while it is admin-only', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', admin: false } })
    expect(status(await requireXboxUser())).toBe(403)
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    expect(status(await requireXboxUser())).toBe(403)
  })

  test('an admin is let in', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', admin: true } })
    expect(await requireXboxUser()).toEqual({ ok: true, id: '1' })
  })
})

describe('requireXboxSession', () => {
  const failure = async () => {
    const result = await requireXboxSession()
    return result.ok ? 200 : (result.response as unknown as { status: number }).status
  }

  test('403 for a non-admin even when they have an account linked', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', xboxxuid: '25354', xboxgamertag: 'TestPlayer' } })
    expect(await failure()).toBe(403)
  })

  test('400 when an admin has no Xbox account linked', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', admin: true } })
    expect(await failure()).toBe(400)
  })

  test('the session, with the account and the gamertag it was linked under', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', admin: true, xboxxuid: '25354', xboxgamertag: 'TestPlayer' } })
    expect(await requireXboxSession()).toEqual({ ok: true, session: { id: '1', xboxxuid: '25354', xboxgamertag: 'TestPlayer' } })
  })
})
