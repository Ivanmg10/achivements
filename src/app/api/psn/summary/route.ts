import { NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { psnFailure, psnSummary } from '@/lib/psnClient'

/** The signed-in user's PSN headline numbers: trophy level, trophies by grade, games. */
export async function GET() {
  const auth = await requirePsnSession()
  if (!auth.ok) return auth.response

  try {
    return NextResponse.json(await psnSummary(auth.session.psnaccountid, auth.session.id))
  } catch (err) {
    return psnFailure(err, 'psn/summary')
  }
}
