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
 * Requires a signed-in viewer, for routes that fetch a THIRD PARTY's public
 * RA data (public/user/*) rather than the viewer's own. The RA Web API key
 * used to authenticate the call can come from the viewer's own linked
 * account, or fall back to the shared app key — either way it's just
 * authenticating the outbound call, not scoping the response to the viewer.
 */
export async function requireViewerApiKey(): Promise<ViewerApiKeyResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) }
  }

  const apiKey = session.user.raid ?? process.env.RA_API_KEY ?? null
  if (!apiKey) {
    return { ok: false, response: NextResponse.json({ message: 'No RA API key configured' }, { status: 503 }) }
  }

  return { ok: true, viewerId: session.user.id, apiKey }
}
