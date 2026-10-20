import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import RankingsPage from '@/components/rankings-page/RankingsPage'
import LandingNav from '@/components/landing-page/landing-nav/LandingNav'
import PublicFooter from '@/components/public-footer/PublicFooter'

export const metadata: Metadata = {
  title: 'Rankings',
  description: 'Achievement hunters ranked in Vault Points: RetroAchievements, Steam and PlayStation, every platform worth the same.',
}

/**
 * Public: signed out, the global rankings under the visitors' bar (the main
 * layout gives a signed-out page nothing around it); signed in, inside the app.
 */
export default async function Rankings() {
  const session = await getServerSession(authOptions)
  if (session) return <RankingsPage signedIn />

  return (
    <div className="min-h-[100dvh] bg-bg-main text-text-main flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <RankingsPage signedIn={false} />
      </main>
      <PublicFooter current="/rankings" />
    </div>
  )
}
