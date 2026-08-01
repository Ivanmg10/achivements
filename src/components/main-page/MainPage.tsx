'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'

import LoadingPage from '../loading-page/LoadingPage'
import MainPagePinnedGames from './main-page-pinned-games/MainPagePinnedGames'
import MainPageProfile from './main-page-profile/MainPageProfile'
import MainPageProgression from './main-page-progression/MainPageProgression'
import MainPageNoRa from './main-page-no-ra/MainPageNoRa'
import MainPageCharts from './main-page-charts/MainPageCharts'
import RARecentlyPlayed from '@/components/ra-recently-played/RARecentlyPlayed'
import { useMainView } from '@/context/MainViewContext'

export default function MainPage() {
  const { status, data: session } = useSession()
  const { view } = useMainView()

  if (status === 'loading')
    return <LoadingPage />

  if (status === 'authenticated' && !session?.user?.raUser?.User)
    return <MainPageNoRa />

  return (
    <motion.main
      className="flex flex-col min-h-full text-text-main"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
        {/* Profile first in DOM → top on mobile; placed col-2 on desktop */}
        <div className="lg:col-start-2 lg:row-start-1">
          <MainPageProfile />
        </div>
        {/* Left column: either pinned games or recently played */}
        <div className="flex flex-col min-h-0 lg:col-start-1 lg:row-start-1">
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
