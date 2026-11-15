import { NextResponse, after } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { unlinkPlatform } from '@/lib/platformLinks'
import { sendSteamLinkNotice } from '@/lib/steamLinkNotice'

export async function POST() {
  const auth = await requireSession()
  if (!auth.ok) return auth.response

  try {
    // The sign-in goes with the link. Who signed up through Steam can set a password with "forgot password".
    const owner = await unlinkPlatform(auth.id, 'steam', true)
    const email = owner?.email
    if (owner && email) after(() => sendSteamLinkNotice({ to: email, username: owner.username, linked: false }))
  } catch {
    return NextResponse.json({ message: 'Could not unlink Steam account' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
