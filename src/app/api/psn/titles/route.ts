import { NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { psnFailure } from '@/lib/psnClient'
import { psnLibrary } from '@/lib/psnSnapshot'
import { timedPsnRead } from '@/lib/psnMetrics'

/** Every game in the signed-in user's PSN trophy list, from the snapshot (202 before the first sync). */
export const GET = timedPsnRead(async function GET(req?: Request) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response

  try {
    return NextResponse.json(await psnLibrary(auth.session.psnaccountid, auth.session.id))
  } catch (err) {
    return psnFailure(err, 'psn/titles')
  }
})
