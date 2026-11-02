import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { loadVaultMe } from '@/lib/vaultMe'
import { canUseXbox } from '@/utils/xboxAccess'

export type { VaultMe } from '@/lib/vaultMe'

/** The signed-in user's own Vault Points: for the header, the profile and the rankings panel. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await loadVaultMe(Number(session.user.id), canUseXbox(session.user.admin))
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[rankings/me GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
