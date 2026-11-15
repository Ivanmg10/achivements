import { NextResponse } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { psnFailure, psnLibrary } from '@/lib/psnClient'

/** Every game in the signed-in user's PSN trophy list: the core, with what the background has enriched so far. */
export async function GET(req?: Request) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response

  try {
    return NextResponse.json(await psnLibrary(auth.session.psnaccountid, auth.session.id))
  } catch (err) {
    return psnFailure(err, 'psn/titles')
  }
}
