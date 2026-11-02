import crypto from 'crypto'
import { NextRequest, NextResponse, after } from 'next/server'
import bcrypt from 'bcrypt'
import pool from '@/lib/db'
import { allowAttempt, clientAddress } from '@/lib/attemptLimit'
import { steamApiKey } from '@/lib/fetchSteam'
import { getPlayerSummaries } from '@/lib/steamClient'
import { expiredTicketCookie, readTicket, siteBase, ticketFromCookieHeader, usernameFromPersona } from '@/lib/steamLogin'
import { onPlatformLinked } from '@/lib/scoreRefresh'
import { sendVerificationEmail } from '@/lib/verificationEmail'
import { BCRYPT_COST, checkEmail, checkUsername } from '@/utils/authValidation'

type SteamPlayer = { personaname?: string; avatarfull?: string; communityvisibilitystate?: number }

/** Steam's "public" community visibility state. */
const PUBLIC = 3

async function steamPlayer(steamid: string, key: string): Promise<SteamPlayer | null> {
  const data = (await getPlayerSummaries(steamid, key)) as { response?: { players?: SteamPlayer[] } }
  return data?.response?.players?.[0] ?? null
}

async function isRegistered(steamid: string): Promise<boolean> {
  const { rows } = await pool.query('SELECT 1 FROM users WHERE steam_login_id = $1', [steamid])
  return rows.length > 0
}

/**
 * After the Steam callback: whether that Steam account already has a user here
 * (then the page signs in), and otherwise what the sign-up form starts from.
 */
export async function GET(req: NextRequest) {
  const steamid = readTicket(ticketFromCookieHeader(req.headers.get('cookie')))
  if (!steamid) return NextResponse.json({ error: 'expired' }, { status: 401 })
  const key = steamApiKey()
  if (!key) return NextResponse.json({ error: 'not-configured' }, { status: 503 })

  try {
    if (await isRegistered(steamid)) return NextResponse.json({ registered: true })
    const player = await steamPlayer(steamid, key)
    if (!player) return NextResponse.json({ error: 'failed' }, { status: 502 })
    const persona = player.personaname ?? ''
    return NextResponse.json({
      registered: false,
      persona,
      avatar: player.avatarfull ?? null,
      username: usernameFromPersona(persona),
      // The account is created either way; the form only warns that the games will not show.
      isPublic: player.communityvisibilitystate === PUBLIC,
    })
  } catch (err) {
    console.error('[auth/steam/register GET]', err)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}

/** The sign-in is done: the ticket must not outlive it, or a shared computer could use it again. */
export function DELETE(req: NextRequest) {
  const secure = siteBase(req.nextUrl.origin).startsWith('https:')
  return NextResponse.json({ ok: true }, { headers: { 'Set-Cookie': expiredTicketCookie(secure) } })
}

/**
 * Creates the account for the Steam account the ticket proves: the username and
 * email the user chose, Steam's name and picture, and Steam already linked.
 * Steam does not share an email, so it is asked for, as in the normal sign-up.
 */
export async function POST(req: NextRequest) {
  const steamid = readTicket(ticketFromCookieHeader(req.headers.get('cookie')))
  if (!steamid) return NextResponse.json({ error: 'expired' }, { status: 401 })
  if (process.env.REGISTRATION_OPEN === 'false') return NextResponse.json({ error: 'closed' }, { status: 403 })
  const key = steamApiKey()
  if (!key) return NextResponse.json({ error: 'not-configured' }, { status: 503 })

  let body: { username?: unknown; email?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (checkUsername(username)) return NextResponse.json({ error: 'invalid-username' }, { status: 400 })
  if (checkEmail(email)) return NextResponse.json({ error: 'invalid-email' }, { status: 400 })

  try {
    if (!(await allowAttempt('signup', clientAddress(req.headers)))) {
      return NextResponse.json({ error: 'too-many' }, { status: 429 })
    }
    if (await isRegistered(steamid)) return NextResponse.json({ error: 'steam-taken' }, { status: 409 })

    const taken = await pool.query(
      'SELECT LOWER(username) = LOWER($1) AS name FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [username, email],
    )
    if (taken.rows.length > 0) {
      const error = taken.rows.some((r: { name: boolean }) => r.name) ? 'username-taken' : 'email-taken'
      return NextResponse.json({ error }, { status: 409 })
    }

    const player = await steamPlayer(steamid, key)
    if (!player) return NextResponse.json({ error: 'failed' }, { status: 502 })

    // Nobody knows this password: the account signs in with Steam, and
    // "forgot password" gives it a real one whenever the user wants.
    const password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), BCRYPT_COST)
    const { rows } = await pool.query(
      `INSERT INTO users (username, password, email, theme, avatar, steamid, steamusername, steam_login_id)
       VALUES ($1, $2, $3, 'dark', $4, $5, $6, $5)
       RETURNING id, username`,
      [username, password, email, player.avatarfull ?? null, steamid, player.personaname || null],
    )
    const created = rows[0] as { id: number; username: string }
    after(() => sendVerificationEmail(created.id, created.username, email))
    await onPlatformLinked(created.id, 'steam')
    return NextResponse.json({ username: created.username }, { status: 201 })
  } catch (err) {
    // Two sign-ups raced past the checks; a unique index stopped the second.
    const { code, constraint } = err as { code?: string; constraint?: string }
    if (code === '23505') {
      const error =
        constraint === 'users_steam_login_id_key' ? 'steam-taken'
          : constraint === 'users_email_lower_key' ? 'email-taken'
            : 'username-taken'
      return NextResponse.json({ error }, { status: 409 })
    }
    console.error('[auth/steam/register POST]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
