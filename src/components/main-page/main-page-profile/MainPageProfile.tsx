'use client'

import { RecentAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import MainPageProfileRa from './main-page-profile-ra/MainPageProfileRa'

import { getGamesInfo, getRecentAchievements } from '@/utils/apiCallsUtils'

export default function MainPageProfile() {
  const { data: session } = useSession()
  const [game, setGame] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    if (session?.user?.raUser?.User && !hasFetched.current) {
      hasFetched.current = true
      getGamesInfo(session.user.raUser.LastGameID.toString(), session, setGame)
      getRecentAchievements(session, setRecentAchievements)
    }
  }, [session])

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
