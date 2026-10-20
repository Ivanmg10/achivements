import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { vaultGuideText } from '@/translations/vaultGuide'
import RankingsGuide from '@/components/rankings-guide/RankingsGuide'
import PublicShell from '@/components/public-shell/PublicShell'

const text = vaultGuideText('en')

export const metadata: Metadata = { title: text.title, description: text.description }

/** Public, like the rankings: signed out under the visitors' bar, signed in inside the app. */
export default async function RankingsHow() {
  const session = await getServerSession(authOptions)
  if (session) return <RankingsGuide />
  return (
    <PublicShell current="/rankings/how">
      <RankingsGuide />
    </PublicShell>
  )
}
