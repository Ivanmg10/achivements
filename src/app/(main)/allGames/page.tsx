'use client'

import NoMainHeader from '@/components/no-main-header/NoMainHeader'
import AllGamesSection from '@/components/all-games-section/AllGamesSection'
import SteamCategorySection from '@/components/steam/steam-category-section/SteamCategorySection'
import { useAllGamesGlobal } from '@/hooks/useAllGamesGlobal'
import { useGameExtraData } from '@/hooks/useGameExtraData'
import { useLanguage } from '@/context/LanguageContext'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'

const CATEGORIES = ['wantToPlay', 'playing', 'completed'] as const

export default function AllGamesPage() {
  const { wantToPlay, playing, completed, loading } = useAllGamesGlobal()
  const extraData = useGameExtraData()
  const { T } = useLanguage()

  const raGames = { wantToPlay, playing, completed }

  return (
    <motion.div
      className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-white"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <NoMainHeader />

        {CATEGORIES.map((category) => (
          <div key={category} className="flex flex-col gap-4">
            <AllGamesSection
              category={category}
              games={raGames[category]}
              loading={loading}
              extraData={extraData}
            />
            {/* Renders nothing unless Steam is linked, so no empty card for RA-only users. */}
            <SteamCategorySection
              category={category}
              title={`Steam · ${T.categories[category]}`}
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
