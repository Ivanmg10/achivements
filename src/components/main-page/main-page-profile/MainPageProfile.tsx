'use client'

import { useSession } from 'next-auth/react'

import { useGameProgression } from '@/hooks/useGameProgression'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'

import MainPageProfileRa from './main-page-profile-ra/MainPageProfileRa'

export default function MainPageProfile() {
  const { data: session } = useSession()
  const lastGameId = session?.user?.raUser?.LastGameID?.toString() ?? null
  const { game, isLoading: gameLoading } = useGameProgression(lastGameId)
  const { achievements: recentAchievements, isLoading: achievementsLoading } = useRecentAchievements()

  return (
    <section className="main-content text-text-main m-3 rounded-xl flex flex-col items-center overflow-y-auto">
      <MainPageProfileRa
        user={session?.user?.raUser}
        game={game}
        gameLoading={gameLoading}
        recentAchievements={recentAchievements}
        achievementsLoading={achievementsLoading}
      />
    </section>
  )
}
