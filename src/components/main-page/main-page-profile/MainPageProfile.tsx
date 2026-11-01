'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import RaLogo from '@/components/ra-logo/RaLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'

import { useGameProgression } from '@/hooks/useGameProgression'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useMainPlatform, MainPlatform } from '@/context/MainPlatformContext'
import { useSubject } from '@/context/SubjectContext'

import MainPageProfileRa from './main-page-profile-ra/MainPageProfileRa'
import MainPageProfileSt from './main-page-profile-st/MainPageProfileSt'
import MainPageProfilePsn from './main-page-profile-psn/MainPageProfilePsn'
import MainPageProfileXbox from './main-page-profile-xbox/MainPageProfileXbox'
import MainPageProfileTabs, { ProfileTab, profilePanelId, profileTabId } from './main-page-profile-tabs/MainPageProfileTabs'
import styles from './MainPageProfile.module.css'

const ID_PREFIX = 'main-profile'

const TABS: Record<MainPlatform, ProfileTab<MainPlatform>> = {
  ra: { id: 'ra', label: 'RetroAchievements', icon: <RaLogo height={11} /> },
  steam: { id: 'steam', label: 'Steam', icon: <SteamLogo size={13} aria-hidden="true" /> },
  psn: { id: 'psn', label: 'PlayStation', icon: <PlaystationLogo size={13} aria-hidden="true" /> },
  xbox: { id: 'xbox', label: 'Xbox', icon: <XboxLogo size={13} aria-hidden="true" /> },
}

export default function MainPageProfile() {
  const { data: session, update } = useSession()
  const subject = useSubject()
  const { platform: tab, setPlatform: setTab, linked } = useMainPlatform()
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

  const profiles: Record<MainPlatform, ReactNode> = {
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
      <MainPageProfileTabs<MainPlatform>
        idPrefix={ID_PREFIX}
        selected={tab}
        onSelect={setTab}
        tabs={linked.map((p) => TABS[p])}
      />
      {/* Keyed by tab, so each platform makes its entrance. */}
      <div
        key={tab}
        role="tabpanel"
        id={profilePanelId(ID_PREFIX, tab)}
        aria-labelledby={profileTabId(ID_PREFIX, tab)}
        data-home-profile
        className={`w-full flex-1 min-h-0 flex flex-col ${styles.enter}`}
      >
        {profiles[tab]}
      </div>
    </section>
  )
}
