import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { psnFailure, psnSummary } from '@/lib/psnClient'

/**
 * The PSN headline numbers of the CheevoVault user whose RetroAchievements
 * name is `u`, for their public page. 404 when that user has no PSN linked
 * (or is not on CheevoVault): the page simply shows no PlayStation card.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  const username = req.nextUrl.searchParams.get('u')
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 })

  let owner: { id: number; psnaccountid: string | null } | undefined
  try {
    const { rows } = await pool.query(
      'SELECT id, psnaccountid FROM users WHERE LOWER(rausername) = LOWER($1) AND psnaccountid IS NOT NULL LIMIT 1',
      [username],
    )
    owner = rows[0]
  } catch (err) {
    console.error('[public/user/psn] lookup', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
  if (!owner?.psnaccountid) return NextResponse.json({ error: 'no-psn' }, { status: 404 })

  try {
    return NextResponse.json(await psnSummary(owner.psnaccountid, String(owner.id)))
  } catch (err) {
    return psnFailure(err, 'public/user/psn')
  }
}
