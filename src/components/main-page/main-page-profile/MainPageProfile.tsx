'use client'

import { useSession } from 'next-auth/react'

import { useGameProgression } from '@/hooks/useGameProgression'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'

import MainPageProfileRa from './main-page-profile-ra/MainPageProfileRa'

export default function MainPageProfile() {
  const { data: session } = useSession()
  const lastGameId = session?.user?.raUser?.LastGameID?.toString() ?? null
  const game = useGameProgression(lastGameId)
  const recentAchievements = useRecentAchievements()

  return (
    <section className="main-content text-text-main m-3 rounded-xl break-all flex flex-col items-center overflow-y-auto">
      <MainPageProfileRa
        user={session?.user?.raUser}
        game={game}
        recentAchievements={recentAchievements}
      />
    </section>
  )
}
