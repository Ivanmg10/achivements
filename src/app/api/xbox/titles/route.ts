import { NextResponse } from 'next/server'
import { requireXboxSession } from '@/lib/apiAuth'
import { xboxFailure, xboxLibrary } from '@/lib/xboxClient'
import { withXboxTelemetry } from '@/lib/xboxTelemetry'

/** Every game in the signed-in user's Xbox library. */
async function get(req?: Request) {
  const auth = await requireXboxSession(req)
  if (!auth.ok) return auth.response

  try {
    return NextResponse.json(await xboxLibrary(auth.session.xboxxuid, auth.session.id))
  } catch (err) {
    return xboxFailure(err, 'xbox/titles')
  }
}

export async function GET(req?: Request) {
  return withXboxTelemetry('xbox/titles', () => get(req))
}
