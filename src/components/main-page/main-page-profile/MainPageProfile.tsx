'use client'

import { useSession } from 'next-auth/react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import RaLogo from '@/components/ra-logo/RaLogo'

import { useGameProgression } from '@/hooks/useGameProgression'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useMainPlatform, MainPlatform } from '@/context/MainPlatformContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'

import MainPageProfileRa from './main-page-profile-ra/MainPageProfileRa'
import MainPageProfileSt from './main-page-profile-st/MainPageProfileSt'
import MainPageProfileTabs, { profilePanelId, profileTabId } from './main-page-profile-tabs/MainPageProfileTabs'

const ID_PREFIX = 'main-profile'

export default function MainPageProfile() {
  const { data: session } = useSession()
  const { isLinked: steamLinked } = useSteamGamesData()
  const { platform: tab, setPlatform: setTab } = useMainPlatform()
  const lastGameId = session?.user?.raUser?.LastGameID?.toString() ?? null
  const { game, isLoading: gameLoading } = useGameProgression(lastGameId)
  const { achievements: recentAchievements, isLoading: achievementsLoading } = useRecentAchievements()

  const raProfile = (
    <MainPageProfileRa
      user={session?.user?.raUser}
      game={game}
      gameLoading={gameLoading}
      recentAchievements={recentAchievements}
      achievementsLoading={achievementsLoading}
    />
  )

  // RA only: the column as it always was — no switch with a single option.
  if (!steamLinked) {
    return (
      <section className="main-content text-text-main m-3 rounded-xl flex flex-col items-center overflow-y-auto">
        {raProfile}
      </section>
    )
  }

  // Both accounts: one profile at a time, switched by low-key tabs at the top.
  return (
    <section className="main-content text-text-main m-3 rounded-xl flex flex-col items-center gap-3 overflow-y-auto">
      <MainPageProfileTabs<MainPlatform>
        idPrefix={ID_PREFIX}
        selected={tab}
        onSelect={setTab}
        tabs={[
          { id: 'ra', label: 'RetroAchievements', icon: <RaLogo height={11} /> },
          { id: 'steam', label: 'Steam', icon: <SteamLogo size={13} aria-hidden="true" /> },
        ]}
      />
      <div
        role="tabpanel"
        id={profilePanelId(ID_PREFIX, tab)}
        aria-labelledby={profileTabId(ID_PREFIX, tab)}
        className="w-full flex-1 min-h-0 flex flex-col"
      >
        {tab === 'ra' ? raProfile : <MainPageProfileSt />}
      </div>
    </section>
  )
}
