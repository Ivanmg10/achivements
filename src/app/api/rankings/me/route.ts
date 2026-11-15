import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { loadVaultMe } from '@/lib/vaultMe'
import { canUseXbox } from '@/utils/xboxAccess'

export type { VaultMe } from '@/lib/vaultMe'

/** The signed-in user's own Vault Points: for the header, the profile and the rankings panel. */
export async function GET() {
  const auth = await requireSession({ error: 'Unauthorized' })
  if (!auth.ok) return auth.response

  try {
    const body = await loadVaultMe(Number(auth.id), canUseXbox(auth.user.admin))
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[rankings/me GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
