import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { unlinkPlatform } from '@/lib/platformLinks'

export async function POST() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    await unlinkPlatform(auth.id, 'psn')
  } catch {
    return NextResponse.json({ message: 'Could not unlink PSN account' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
