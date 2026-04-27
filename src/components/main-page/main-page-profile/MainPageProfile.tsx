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
    <section className="col-start-5 col-end-7 row-start-1 row-end-2 main-content bg-bg-card text-text-main m-3 rounded-xl break-all flex flex-col items-center">
      <MainPageProfileRa
        user={session?.user?.raUser}
        game={game}
        recentAchievements={recentAchievements}
      />
    </section>
  )
}
