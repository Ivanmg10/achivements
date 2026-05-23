'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import { usePublicUserProfile } from '@/hooks/usePublicUserProfile'
import { usePublicUserAchievements } from '@/hooks/usePublicUserAchievements'
import { usePublicUserRank } from '@/hooks/usePublicUserRank'
import { usePublicUserAwards } from '@/hooks/usePublicUserAwards'
import { usePublicUserCompleted } from '@/hooks/usePublicUserCompleted'
import { usePublicUserRecentlyPlayed } from '@/hooks/usePublicUserRecentlyPlayed'
import { usePublicGameProgression } from '@/hooks/usePublicGameProgression'
import { IconUserOff } from '@tabler/icons-react'

import MainPageProfileRa from '@/components/main-page/main-page-profile/main-page-profile-ra/MainPageProfileRa'
import PublicRecentlyPlayed from './public-recently-played/PublicRecentlyPlayed'
import PublicUserStats from './public-user-stats/PublicUserStats'

interface PublicUserPageProps {
  raUsername: string
}

export default function PublicUserPage({ raUsername }: PublicUserPageProps) {
  const { T } = useLanguage()
  const { profile, isLoading: profileLoading, error } = usePublicUserProfile(raUsername)
  const { achievements, isLoading: achLoading } = usePublicUserAchievements(raUsername)
  const { rank, isLoading: rankLoading } = usePublicUserRank(raUsername)
  const { awards, isLoading: awardsLoading } = usePublicUserAwards(raUsername)
  const { completed, isLoading: completedLoading } = usePublicUserCompleted(raUsername)
  const { games: recentGames, isLoading: recentLoading } = usePublicUserRecentlyPlayed(raUsername)
  // Use first recently-played game ID — recentGames loads reliably and is the same game as LastGameID
  const lastGameId = recentGames[0]?.GameID ?? null
  const { game: lastGame } = usePublicGameProgression(raUsername, lastGameId)

  // Sort achievements desc for profile recent achievements section
  const recentAchievements = useMemo(
    () => [...achievements].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()).slice(0, 20),
    [achievements],
  )

  if (error && !profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-secondary">
        <IconUserOff className="w-10 h-10 opacity-40" aria-hidden />
        <p className="text-sm">{T.publicProfile.notFound.replace('{u}', raUsername)}</p>
      </div>
    )
  }

  return (
    <motion.main
      className="flex flex-col min-h-full text-text-main"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
        {/* Right: profile card — col-2 on desktop, first in DOM */}
        <div className="lg:col-start-2 lg:row-start-1">
          <section className="main-content text-text-main m-3 rounded-xl flex flex-col items-center overflow-y-auto">
            <MainPageProfileRa
              user={profile}
              game={lastGame}
              recentAchievements={recentAchievements}
            />
          </section>
        </div>

        {/* Left: recently played */}
        <div className="flex flex-col min-h-0 lg:col-start-1 lg:row-start-1">
          <div className="m-3 bg-bg-card rounded-xl p-4 flex flex-col flex-1 min-h-0">
            <PublicRecentlyPlayed raUsername={raUsername} games={recentGames} isLoading={recentLoading || profileLoading} />
          </div>
        </div>
      </div>

      <PublicUserStats
        achievements={achievements}
        rank={rank}
        awards={awards}
        completed={completed}
        isLoading={achLoading || rankLoading}
        awardsLoading={awardsLoading}
        completedLoading={completedLoading}
      />
    </motion.main>
  )
}
