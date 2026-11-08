'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'

import { useGameProgression } from '@/hooks/useGameProgression'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useMainPlatform } from '@/context/MainPlatformContext'
import { useSubject } from '@/context/SubjectContext'
import { useLanguage } from '@/context/LanguageContext'

import MainPageProfileRa from './main-page-profile-ra/MainPageProfileRa'
import MainPageProfileSt from './main-page-profile-st/MainPageProfileSt'
import MainPageProfilePsn from './main-page-profile-psn/MainPageProfilePsn'
import MainPageProfileXbox from './main-page-profile-xbox/MainPageProfileXbox'
import Tabs, { tabIds } from '@/components/ui/Tabs'
import { PLATFORM_NAME } from '@/utils/gameRef'
import styles from './MainPageProfile.module.css'
import type { GameSource } from '@/types/game'

const ID_PREFIX = 'main-profile'

export default function MainPageProfile() {
  const { data: session, update } = useSession()
  const subject = useSubject()
  const { platform: tab, setPlatform: setTab, linked } = useMainPlatform()
  const { T } = useLanguage()
  const lastGameId = session?.user?.raUser?.LastGameID?.toString() ?? null
  const { game, isLoading: gameLoading, refetch: refetchGame } = useGameProgression(lastGameId)
  const {
    achievements: recentAchievements,
    isLoading: achievementsLoading,
    refetch: refetchAchievements,
  } = useRecentAchievements()

  // Points and picture live on the user's row: the server re-reads them from RA,
  // then update() brings the session up to date. Throws, so the button can say so.
  const refreshRa = async () => {
    refetchGame()
    refetchAchievements()
    const res = await fetch('/api/updateRaUser', { method: 'PUT' })
    if (!res.ok) throw new Error(`Failed to refresh RA profile (${res.status})`)
    await update()
  }

  const profiles: Record<GameSource, ReactNode> = {
    ra: (
      <MainPageProfileRa
        user={session?.user?.raUser}
        game={game}
        gameLoading={gameLoading}
        recentAchievements={recentAchievements}
        achievementsLoading={achievementsLoading}
        // Someone else's page has nothing of the viewer's to refresh.
        onRefresh={subject ? undefined : refreshRa}
      />
    ),
    steam: <MainPageProfileSt />,
    psn: <MainPageProfilePsn />,
    xbox: <MainPageProfileXbox />,
  }

  // One account: the column as it always was — no switch with a single option.
  if (linked.length <= 1) {
    return (
      <section className="main-content text-text-main m-3 rounded-tile flex flex-col items-center overflow-y-auto">
        <div data-home-profile className={`w-full flex-1 min-h-0 flex flex-col items-center ${styles.enter}`}>{profiles[tab]}</div>
      </section>
    )
  }

  // Several: one profile at a time, switched by low-key tabs at the top.
  return (
    <section className="main-content text-text-main m-3 rounded-tile flex flex-col items-center gap-3 overflow-y-auto">
      <Tabs<GameSource>
        id={ID_PREFIX}
        aria-label={T.steam.profileTabsLabel}
        size="sm"
        className="w-full"
        value={tab}
        onChange={setTab}
        tabs={linked.map((p) => ({ value: p, label: PLATFORM_NAME[p] }))}
      />
      {/* Keyed by tab, so each platform makes its entrance. */}
      <div
        key={tab}
        role="tabpanel"
        id={tabIds(ID_PREFIX, tab).panel}
        aria-labelledby={tabIds(ID_PREFIX, tab).tab}
        data-home-profile
        className={`w-full flex-1 min-h-0 flex flex-col ${styles.enter}`}
      >
        {profiles[tab]}
      </div>
    </section>
  )
}
