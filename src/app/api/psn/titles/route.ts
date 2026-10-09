import { NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { psnFailure, psnTitles } from '@/lib/psnClient'

/** Every game in the signed-in user's PSN trophy list. */
export async function GET() {
  const auth = await requirePsnSession()
  if (!auth.ok) return auth.response

  try {
    return NextResponse.json(await psnTitles(auth.session.psnaccountid, auth.session.id))
  } catch (err) {
    return psnFailure(err, 'psn/titles')
  }
}
