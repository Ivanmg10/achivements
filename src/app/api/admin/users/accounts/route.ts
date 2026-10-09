import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { fetchRaProfile, validRaCredentials } from '@/lib/raProfile'
import { steamApiKey } from '@/lib/fetchSteam'
import { clearUserCache } from '@/lib/steamCache'
import { getPlayerSummaries } from '@/lib/steamClient'
import { readSteamId } from '@/lib/steamAccount'
import { forgetUser } from '@/lib/userRecord'

/**
 * An admin linking or unlinking a user's RetroAchievements or Steam account,
 * for support. The same checks as when users do it themselves: an RA account
 * is only stored if RA accepts that username and key, and a Steam ID only if
 * Steam knows the profile. Neither proves the account is the user's own (users
 * link Steam by name too), which is why each link and unlink goes in the
 * action log.
 */

type Target = { id: number; username: string }

async function findUser(id: unknown): Promise<Target | null | 'bad-id'> {
  if (!/^\d+$/.test(String(id ?? ''))) return 'bad-id'
  const { rows } = await pool.query('SELECT id, username FROM users WHERE id = $1', [id])
  return rows[0] ?? null
}

// POST { id, platform: 'ra', username, apiKey } | { id, platform: 'steam', steamid }
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>
    const target = await findUser(body.id)
    if (target === 'bad-id') return NextResponse.json({ error: 'A numeric id is required' }, { status: 400 })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (body.platform === 'ra') {
      if (!validRaCredentials(body.username, body.apiKey)) {
        return NextResponse.json({ error: 'RA username and API key are required' }, { status: 400 })
      }
      const apiKey = (body.apiKey as string).trim()
      const fetched = await fetchRaProfile(body.username.trim(), apiKey)
      if (!fetched.ok) return NextResponse.json({ error: fetched.error }, { status: fetched.status })
      const { profile } = fetched

      try {
        await pool.query('UPDATE users SET "raUser" = $1, rausername = $2, raid = $3 WHERE id = $4', [
          JSON.stringify(profile), profile.User, apiKey, target.id,
        ])
      } catch (err) {
        if ((err as { code?: string }).code === '23505') {
          return NextResponse.json({ error: 'That RA key already links another account' }, { status: 409 })
        }
        throw err
      }
      forgetUser(target.id)
      await logAdminAction(auth.admin, 'link-ra', target, { rausername: profile.User })
      return NextResponse.json({ ok: true, rausername: profile.User, ra_display: profile.User })
    }

    if (body.platform === 'steam') {
      const steamid = readSteamId(body.steamid)
      if (!steamid) return NextResponse.json({ error: 'A SteamID64 (17 digits) or profile link is required' }, { status: 400 })
      const key = steamApiKey()
      if (!key) return NextResponse.json({ error: 'No Steam API key configured' }, { status: 503 })

      let persona: string | null = null
      try {
        const data = (await getPlayerSummaries(steamid, key)) as { response?: { players?: { personaname?: string }[] } }
        const player = data?.response?.players?.[0]
        if (!player) return NextResponse.json({ error: 'Steam has no profile with that ID' }, { status: 400 })
        persona = player.personaname ?? null
      } catch (err) {
        console.error('[admin/users/accounts] Steam lookup', err)
        return NextResponse.json({ error: 'Steam is unavailable, try again' }, { status: 502 })
      }

      // One Steam account may be linked to several users, as users can do themselves.
      await pool.query('UPDATE users SET steamid = $1, steamusername = $2 WHERE id = $3', [steamid, persona, target.id])
      await clearUserCache(String(target.id))
      forgetUser(target.id)
      await logAdminAction(auth.admin, 'link-steam', target, { steamid, steamusername: persona })
      return NextResponse.json({ ok: true, steamid, steamusername: persona })
    }

    return NextResponse.json({ error: 'platform must be ra or steam' }, { status: 400 })
  } catch (err) {
    console.error('[admin/users/accounts POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE ?id=<user>&platform=ra|steam
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const params = new URL(req.url).searchParams
    const platform = params.get('platform')
    if (platform !== 'ra' && platform !== 'steam') {
      return NextResponse.json({ error: 'platform must be ra or steam' }, { status: 400 })
    }
    const target = await findUser(params.get('id'))
    if (target === 'bad-id') return NextResponse.json({ error: 'A numeric id is required' }, { status: 400 })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (platform === 'ra') {
      await pool.query('UPDATE users SET "raUser" = NULL, rausername = NULL, raid = NULL WHERE id = $1', [target.id])
    } else {
      await pool.query('UPDATE users SET steamid = NULL, steamusername = NULL WHERE id = $1', [target.id])
      await clearUserCache(String(target.id))
    }
    forgetUser(target.id)
    await logAdminAction(auth.admin, platform === 'ra' ? 'unlink-ra' : 'unlink-steam', target)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/users/accounts DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
