'use client'

import NoMainHeader from '@/components/no-main-header/NoMainHeader'
import AllGamesSection from '@/components/all-games-section/AllGamesSection'
import { useAllGamesGlobal } from '@/hooks/useAllGamesGlobal'
import { useGameExtraData } from '@/hooks/useGameExtraData'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'

export default function AllGamesPage() {
  const { wantToPlay, playing, completed, loading, error } = useAllGamesGlobal()
  const extraData = useGameExtraData()

  return (
    <motion.div
      className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-white"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <NoMainHeader />

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <AllGamesSection
          category="wantToPlay"
          games={wantToPlay}
          loading={loading}
          extraData={extraData}
        />
        <AllGamesSection
          category="playing"
          games={playing}
          loading={loading}
          extraData={extraData}
        />
        <AllGamesSection
          category="completed"
          games={completed}
          loading={loading}
          extraData={extraData}
        />
      </div>
    </motion.div>
  )
}
