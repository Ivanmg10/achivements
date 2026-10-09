import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

/** Whose data a read route answers for. For someone else's, `raid` is whichever key can read it: see dataOwner. */
export type DataOwner = { id: string; rausername?: string; raid?: string; steamid?: string; psnaccountid?: string }

/**
 * The account a read route answers for: the signed-in user's own, or, when a
 * GET carries `?user=<name>`, that CheevoVault user's — which is how a public
 * profile shows someone else's data through the very routes the main page uses.
 *
 * Only GET can name another user, so a write can never be aimed at someone
 * else's account. RA calls are signed with the viewer's own key when they have
 * one, and otherwise with the owner's own, so a viewer with no RA account can
 * still see it. Either way the key stays on the server and only that user's
 * public RA data is read with it. Steam and PSN use the app's own credentials.
 * Null when not signed in, when the named user does not exist, or when they
 * keep their profile private (the owner still reads their own).
 */
export async function dataOwner(req?: Request): Promise<DataOwner | null> {
  const session = await getServerSession(authOptions)
  const me = session?.user
  if (!me?.id) return null

  const name = req && req.method === 'GET' ? new URL(req.url).searchParams.get('user') : null
  if (!name) return me

  // Only when it is asked for: most calls are the user's own.
  const { findSubject } = await import('@/lib/publicUser')
  const target = await findSubject(name)
  if (!target) return null
  // A private profile is for its owner only: nobody else reads its data by name.
  if (!target.profilePublic && String(target.id) !== String(me.id)) return null
  return {
    id: String(target.id),
    rausername: target.rausername ?? undefined,
    raid: me.raid ?? target.raid ?? undefined,
    steamid: target.steamid ?? undefined,
    psnaccountid: target.psnaccountid ?? undefined,
  }
}

type RaSession = { id: string; rausername: string; raid: string }
export type RaSessionResult = { ok: true; session: RaSession } | { ok: false; response: NextResponse }

export type SessionResult = { ok: true; id: string } | { ok: false; response: NextResponse }

/** Requires just a signed-in user — no RA account linkage needed. */
export async function requireSession(): Promise<SessionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) }
  }
  return { ok: true, id: session.user.id }
}

/**
 * Requires a signed-in user with their own RA account linked (own username +
 * personal Web API key). This is the shape almost every "my data" route
 * needs (pass `req` so a GET may name another user: see dataOwner) — 401 if not signed in, 400 if signed in but no RA account linked.
 */
export async function requireRaSession(req?: Request): Promise<RaSessionResult> {
  const owner = await dataOwner(req)
  if (!owner) {
    return { ok: false, response: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) }
  }

  const { id, rausername, raid } = owner
  if (!rausername || !raid) {
    return { ok: false, response: NextResponse.json({ message: 'No RA account linked' }, { status: 400 }) }
  }

  return { ok: true, session: { id, rausername, raid } }
}

export type ViewerApiKeyResult = { ok: true; viewerId: string; apiKey: string } | { ok: false; response: NextResponse }

/**
 * Requires a signed-in viewer with their own RA key, for routes that fetch a
 * THIRD PARTY's public RA data (public/user/*) rather than the viewer's own.
 * The key only authenticates the outbound call; it does not scope the response.
 *
 * There is deliberately no shared app key to fall back on: without an RA
 * account of their own, a viewer sees nothing from RA, so there is nothing to
 * ask RA for. A missing key is therefore the viewer's state to fix (400), not
 * a server fault (503).
 */
export async function requireViewerApiKey(): Promise<ViewerApiKeyResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) }
  }

  const apiKey = session.user.raid
  if (!apiKey) {
    return { ok: false, response: NextResponse.json({ message: 'No RA account linked' }, { status: 400 }) }
  }

  return { ok: true, viewerId: session.user.id, apiKey }
}

type SteamSession = { id: string; steamid: string; apiKey: string }
export type SteamSessionResult = { ok: true; session: SteamSession } | { ok: false; response: NextResponse }

/**
 * Requires a signed-in user with a linked Steam account, plus the server-wide
 * Steam Web API key. Unlike RA — where the key is the user's own — Steam uses
 * one app key for every call, so a missing key is a 503 (our misconfiguration),
 * not a 400 (something the user can fix).
 */
export async function requireSteamSession(req?: Request): Promise<SteamSessionResult> {
  const owner = await dataOwner(req)
  if (!owner) {
    return { ok: false, response: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) }
  }

  const { id, steamid } = owner
  if (!steamid) {
    return { ok: false, response: NextResponse.json({ message: 'No Steam account linked' }, { status: 400 }) }
  }

  const apiKey = process.env.STEAM_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, response: NextResponse.json({ message: 'No Steam API key configured' }, { status: 503 }) }
  }

  return { ok: true, session: { id, steamid, apiKey } }
}

type PsnSession = { id: string; psnaccountid: string }
export type PsnSessionResult = { ok: true; session: PsnSession } | { ok: false; response: NextResponse }

/**
 * Requires a signed-in user with a linked PSN account. Whether the app's PSN
 * credentials are set up is the PSN call's to find out: it fails with a
 * PsnError that psnFailure turns into 503 not-configured.
 */
export async function requirePsnSession(req?: Request): Promise<PsnSessionResult> {
  const owner = await dataOwner(req)
  if (!owner) {
    return { ok: false, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }

  const { id, psnaccountid } = owner
  if (!psnaccountid) {
    return { ok: false, response: NextResponse.json({ error: 'not-linked' }, { status: 400 }) }
  }


  return { ok: true, session: { id, psnaccountid } }
}
