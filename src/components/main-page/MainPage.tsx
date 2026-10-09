'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'

import MainPageSkeleton from './main-page-skeleton/MainPageSkeleton'
import MainPagePinnedGames from './main-page-pinned-games/MainPagePinnedGames'
import MainPageProfile from './main-page-profile/MainPageProfile'
import ConnectAccounts from '@/components/connect-accounts/ConnectAccounts'
import MainPageWithoutRa from './main-page-without-ra/MainPageWithoutRa'
import MainPageCharts from './main-page-charts/MainPageCharts'
import RARecentlyPlayed from '@/components/ra-recently-played/RARecentlyPlayed'
import { useMainView } from '@/context/MainViewContext'
import { useRaLinked } from '@/hooks/useRaLinked'

export default function MainPage() {
  const { status, data: session } = useSession()
  const { view } = useMainView()
  const raLinked = useRaLinked()

  // Only the first read, while there is no session yet. update() (RaUserRefresher
  // calls it on every visit) sets the status back to 'loading' for a moment with
  // the session still in hand; swapping the page for the skeleton then made it
  // jump down and back up.
  if (status === 'loading' && !session)
    return <MainPageSkeleton />

  if (status === 'authenticated' && !raLinked) {
    // Steam or PSN alone is enough for a main page; no account at all gets the connect prompt.
    return session?.user?.steamid || session?.user?.psnaccountid ? <MainPageWithoutRa /> : <ConnectAccounts />
  }

  return (
    <motion.main
      className="home-fit flex flex-col min-h-full text-text-main"
      // Opacity only: content landing where the skeleton was, with no slide on top.
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="home-fit-top flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
        {/* Profile first in DOM → top on mobile; placed col-2 on desktop */}
        <div className="home-fit-side min-h-0 flex flex-col lg:col-start-2 lg:row-start-1">
          <MainPageProfile />
        </div>
        {/* Left column: either pinned games or recently played */}
        <div className="home-fit-main flex flex-col min-h-0 lg:col-start-1 lg:row-start-1">
          {view === 'pinned' ? (
            <MainPagePinnedGames />
          ) : (
            <div className="m-3 bg-bg-card rounded-xl p-4 flex flex-col flex-1 min-h-0">
              <RARecentlyPlayed />
            </div>
          )}
        </div>
      </div>

      <MainPageCharts />
    </motion.main>
  )
}
