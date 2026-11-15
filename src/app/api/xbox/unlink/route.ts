import { NextResponse } from 'next/server'
import { requireXboxUser } from '@/lib/apiAuth'
import { unlinkPlatform } from '@/lib/platformLinks'

export async function POST() {
  const auth = await requireXboxUser()
  if (!auth.ok) return auth.response

  try {
    await unlinkPlatform(auth.id, 'xbox')
  } catch (err) {
    console.error('[xbox/unlink]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
