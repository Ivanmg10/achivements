import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export type RaSession = { id: string; rausername: string; raid: string }
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
 * needs — 401 if not signed in, 400 if signed in but no RA account linked.
 */
export async function requireRaSession(): Promise<RaSessionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) }
  }

  const { id, rausername, raid } = session.user
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

export type SteamSession = { id: string; steamid: string; apiKey: string }
export type SteamSessionResult = { ok: true; session: SteamSession } | { ok: false; response: NextResponse }

/**
 * Requires a signed-in user with a linked Steam account, plus the server-wide
 * Steam Web API key. Unlike RA — where the key is the user's own — Steam uses
 * one app key for every call, so a missing key is a 503 (our misconfiguration),
 * not a 400 (something the user can fix).
 */
export async function requireSteamSession(): Promise<SteamSessionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) }
  }

  const { id, steamid } = session.user
  if (!steamid) {
    return { ok: false, response: NextResponse.json({ message: 'No Steam account linked' }, { status: 400 }) }
  }

  const apiKey = process.env.STEAM_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, response: NextResponse.json({ message: 'No Steam API key configured' }, { status: 503 }) }
  }

  return { ok: true, session: { id, steamid, apiKey } }
}
