'use client'

import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'

import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { calcStreak } from '@/utils/utils'

import MainSidePanelCategories from './main-side-panel-categories/MainSidePanelCategories'
import MainSidePanelLastAchievement from './main-side-panel-last-achievement/MainSidePanelLastAchievement'
import MainSidePanelStats from './main-side-panel-stats/MainSidePanelStats'

export default function MainSidePanel() {
  const { data: session } = useSession()
  const recentAch = useRecentAchievements()

  const raUser = session?.user?.raUser
  const lastAch = recentAch[0] ?? null
  const streak = calcStreak(recentAch)

  return (
    <aside className="bg-bg-card m-2 rounded-lg flex flex-col items-center gap-4 pb-4">
      <section className="flex flex-col items-center w-full">
        <div className="flex p-5 gap-3 justify-between items-start w-full">
          <h1 className="text-xl">Bienvenido {raUser?.User}</h1>
          {raUser?.UserPic && (
            <Image
              src={`https://retroachievements.org${raUser.UserPic}`}
              alt="user"
              width={100}
              height={100}
              className="w-1/3 rounded-full"
              unoptimized
            />
          )}
        </div>
        <Link
          href={session === undefined ? '/authPage' : '/user'}
          className="w-[90%] text-center bg-bg-main px-2 py-2 rounded-3xl border-2 border-bg-card hover:scale-[1.03] transition-transform duration-200"
        >
          {session === undefined ? 'Iniciar session' : 'Ajustes de usuario'}
        </Link>
      </section>

      {raUser && <MainSidePanelStats raUser={raUser} streak={streak} />}

      {lastAch && <MainSidePanelLastAchievement achievement={lastAch} />}

      <MainSidePanelCategories />
    </aside>
  )
}
