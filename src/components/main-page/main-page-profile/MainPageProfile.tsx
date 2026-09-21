'use client'

import { useSession } from 'next-auth/react'

import { useGameProgression } from '@/hooks/useGameProgression'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'

import MainPageProfileRa from './main-page-profile-ra/MainPageProfileRa'
import MainPageProfileSt from './main-page-profile-st/MainPageProfileSt'

export default function MainPageProfile() {
  const { data: session } = useSession()
  const { isLinked: steamLinked } = useSteamGamesData()
  const lastGameId = session?.user?.raUser?.LastGameID?.toString() ?? null
  const { game, isLoading: gameLoading } = useGameProgression(lastGameId)
  const { achievements: recentAchievements, isLoading: achievementsLoading } = useRecentAchievements()

  return (
    <section className="main-content text-text-main m-3 rounded-xl flex flex-col items-center gap-3 overflow-y-auto">
      <MainPageProfileRa
        user={session?.user?.raUser}
        game={game}
        gameLoading={gameLoading}
        recentAchievements={recentAchievements}
        achievementsLoading={achievementsLoading}
      />
      {/* Only once linked — connecting lives on /user, not under every RA profile. */}
      {steamLinked && <MainPageProfileSt />}
    </section>
  )
}
