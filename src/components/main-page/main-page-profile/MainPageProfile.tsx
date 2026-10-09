'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import RaLogo from '@/components/ra-logo/RaLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'

import { useGameProgression } from '@/hooks/useGameProgression'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useMainPlatform, MainPlatform } from '@/context/MainPlatformContext'

import MainPageProfileRa from './main-page-profile-ra/MainPageProfileRa'
import MainPageProfileSt from './main-page-profile-st/MainPageProfileSt'
import MainPageProfilePsn from './main-page-profile-psn/MainPageProfilePsn'
import MainPageProfileTabs, { ProfileTab, profilePanelId, profileTabId } from './main-page-profile-tabs/MainPageProfileTabs'

const ID_PREFIX = 'main-profile'

const TABS: Record<MainPlatform, ProfileTab<MainPlatform>> = {
  ra: { id: 'ra', label: 'RetroAchievements', icon: <RaLogo height={11} /> },
  steam: { id: 'steam', label: 'Steam', icon: <SteamLogo size={13} aria-hidden="true" /> },
  psn: { id: 'psn', label: 'PlayStation', icon: <PlaystationLogo size={13} aria-hidden="true" /> },
}

export default function MainPageProfile() {
  const { data: session } = useSession()
  const { platform: tab, setPlatform: setTab, linked } = useMainPlatform()
  const lastGameId = session?.user?.raUser?.LastGameID?.toString() ?? null
  const { game, isLoading: gameLoading } = useGameProgression(lastGameId)
  const { achievements: recentAchievements, isLoading: achievementsLoading } = useRecentAchievements()

  const profiles: Record<MainPlatform, ReactNode> = {
    ra: (
      <MainPageProfileRa
        user={session?.user?.raUser}
        game={game}
        gameLoading={gameLoading}
        recentAchievements={recentAchievements}
        achievementsLoading={achievementsLoading}
      />
    ),
    steam: <MainPageProfileSt />,
    psn: <MainPageProfilePsn />,
  }

  // One account: the column as it always was — no switch with a single option.
  if (linked.length <= 1) {
    return (
      <section className="main-content text-text-main m-3 rounded-xl flex flex-col items-center overflow-y-auto">
        {profiles[tab]}
      </section>
    )
  }

  // Several: one profile at a time, switched by low-key tabs at the top.
  return (
    <section className="main-content text-text-main m-3 rounded-xl flex flex-col items-center gap-3 overflow-y-auto">
      <MainPageProfileTabs<MainPlatform>
        idPrefix={ID_PREFIX}
        selected={tab}
        onSelect={setTab}
        tabs={linked.map((p) => TABS[p])}
      />
      <div
        role="tabpanel"
        id={profilePanelId(ID_PREFIX, tab)}
        aria-labelledby={profileTabId(ID_PREFIX, tab)}
        className="w-full flex-1 min-h-0 flex flex-col"
      >
        {profiles[tab]}
      </div>
    </section>
  )
}
