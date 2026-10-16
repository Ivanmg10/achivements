'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { IconSettings } from '@tabler/icons-react'
import MainPageProfileTabs, { profilePanelId, profileTabId, type ProfileTab } from '@/components/main-page/main-page-profile/main-page-profile-tabs/MainPageProfileTabs'
import UserPreferencesGeneral from '@/components/user-page/user-preferences-general/UserPreferencesGeneral'
import UserPreferencesPlatform from '@/components/user-page/user-preferences-platform/UserPreferencesPlatform'
import UserRaPreferences from '@/components/user-page/user-ra-preferences/UserRaPreferences'
import UserPsnPreferences from '@/components/user-page/user-psn-preferences/UserPsnPreferences'
import UserXboxPreferences from '@/components/user-page/user-xbox-preferences/UserXboxPreferences'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import type { FavoriteGame } from '@/components/favorite-game-modal/FavoriteGameModal'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import { useLanguage } from '@/context/LanguageContext'
import { useStoredChoice } from '@/hooks/useStoredChoice'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import type { GameSource } from '@/types/steam'
import { notify } from '@/lib/notify'

// Modals are downloaded the first time they are wanted, not with the page.
const FavoriteGameModal = dynamic(() => import('@/components/favorite-game-modal/FavoriteGameModal'))
const GenderModal = dynamic(() => import('@/components/gender-modal/GenderModal'))
const LanguageModal = dynamic(() => import('@/components/language-modal/LanguageModal'))
const ThemeModal = dynamic(() => import('@/components/theme-modal/ThemeModal'))
const HiddenGamesModal = dynamic(() => import('@/components/hidden-games-modal/HiddenGamesModal'))

type PrefTab = 'general' | GameSource

const ID_PREFIX = 'account-preferences'
const TAB_IDS: readonly PrefTab[] = ['general', 'ra', 'steam', 'psn', 'xbox']

/** Saves the favourite game for one platform and refreshes the session. */
async function saveFavorite(source: GameSource, game: FavoriteGame | null) {
  const res = game
    ? await fetch('/api/updateFavoriteGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...game, source }),
      })
    : await fetch(`/api/updateFavoriteGame?source=${source}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Saving the favourite game failed (${res.status})`)
}

/**
 * The account's preferences in tabs, so the card stays the same height however
 * many platforms are linked: General (theme, language, profile, hidden games),
 * then one tab per platform with its favourite game and its own choices. The
 * tab last open is remembered in this browser.
 */
export default function UserPreferencesCard() {
  const { data: session, update } = useSession()
  const { T } = useLanguage()
  const xboxEnabled = useXboxEnabled()
  const [saved, setTab] = useStoredChoice<PrefTab>('account-preferences-tab', TAB_IDS, 'general')
  const [themeOpen, setThemeOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [favoriteOpen, setFavoriteOpen] = useState<GameSource | null>(null)
  const [hiddenOpen, setHiddenOpen] = useState(false)
  const [genderOpen, setGenderOpen] = useState(false)

  const user = session?.user
  const favorites: Record<GameSource, FavoriteGame | null> = {
    ra: user?.favorite_game ?? null,
    steam: user?.favorite_steam_game ?? null,
    psn: user?.favorite_psn_game ?? null,
    xbox: user?.favorite_xbox_game ?? null,
  }

  const tabs: ProfileTab<PrefTab>[] = [
    { id: 'general', label: T.userData.prefsGeneral, icon: <IconSettings size={13} aria-hidden="true" /> },
    { id: 'ra', label: 'RetroAchievements', icon: <RaLogo height={11} /> },
    { id: 'steam', label: 'Steam', icon: <SteamLogo size={13} aria-hidden="true" /> },
    { id: 'psn', label: 'PlayStation', icon: <PlaystationLogo size={13} aria-hidden="true" /> },
    ...(xboxEnabled ? [{ id: 'xbox' as const, label: 'Xbox', icon: <XboxLogo size={13} aria-hidden="true" /> }] : []),
  ]
  // A remembered Xbox tab for someone who may no longer see Xbox falls back to General.
  const tab = tabs.some((t) => t.id === saved) ? saved : 'general'

  async function handleSave(source: GameSource, game: FavoriteGame | null) {
    await saveFavorite(source, game)
    await update()
    notify.success(T.toast.saved)
  }

  const platforms: Record<GameSource, { label: string; icon: ReactNode; extras?: ReactNode }> = {
    ra: { label: T.userPage.favoriteRaGame, icon: <RaLogo height={11} />, extras: <UserRaPreferences /> },
    steam: { label: T.userPage.favoriteSteamGame, icon: <SteamLogo size={18} className="text-[#66c0f4]" aria-hidden="true" /> },
    psn: { label: T.userPage.favoritePsnGame, icon: <PlaystationLogo size={18} className="text-[#0070d1]" aria-hidden="true" />, extras: <UserPsnPreferences /> },
    xbox: { label: T.userPage.favoriteXboxGame, icon: <XboxLogo size={18} className="text-[#107c10]" aria-hidden="true" />, extras: <UserXboxPreferences /> },
  }

  return (
    <section className="bg-bg-card rounded-3xl p-6 flex flex-col gap-4 h-full">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        {T.userPage.preferences}
      </h2>

      <MainPageProfileTabs<PrefTab>
        idPrefix={ID_PREFIX}
        label={T.userData.prefsTabsLabel}
        tabs={tabs}
        selected={tab}
        onSelect={setTab}
        size="md"
      />

      <div
        role="tabpanel"
        id={profilePanelId(ID_PREFIX, tab)}
        aria-labelledby={profileTabId(ID_PREFIX, tab)}
        className="bg-bg-main rounded-2xl p-3 sm:p-4 flex-1"
      >
        {tab === 'general' ? (
          <UserPreferencesGeneral
            onOpenTheme={() => setThemeOpen(true)}
            onOpenLanguage={() => setLangOpen(true)}
            onOpenGender={() => setGenderOpen(true)}
            onOpenHidden={() => setHiddenOpen(true)}
          />
        ) : (
          <UserPreferencesPlatform
            source={tab}
            label={platforms[tab].label}
            icon={platforms[tab].icon}
            favorite={favorites[tab]}
            onEditFavorite={() => setFavoriteOpen(tab)}
          >
            {platforms[tab].extras}
          </UserPreferencesPlatform>
        )}
      </div>

      <LazyWhenOpened open={themeOpen}>
        <ThemeModal isOpen={themeOpen} onClose={() => setThemeOpen(false)} />
      </LazyWhenOpened>
      <LazyWhenOpened open={hiddenOpen}>
        <HiddenGamesModal isOpen={hiddenOpen} onClose={() => setHiddenOpen(false)} />
      </LazyWhenOpened>
      <LazyWhenOpened open={langOpen}>
        <LanguageModal isOpen={langOpen} onClose={() => setLangOpen(false)} />
      </LazyWhenOpened>
      <LazyWhenOpened open={genderOpen}>
        <GenderModal isOpen={genderOpen} onClose={() => setGenderOpen(false)} current={user?.gender} />
      </LazyWhenOpened>
      <LazyWhenOpened open={favoriteOpen !== null}>
        <FavoriteGameModal
          isOpen={favoriteOpen !== null}
          source={favoriteOpen ?? 'ra'}
          current={favorites[favoriteOpen ?? 'ra']}
          onClose={() => setFavoriteOpen(null)}
          onSave={(game) => handleSave(favoriteOpen ?? 'ra', game)}
        />
      </LazyWhenOpened>
    </section>
  )
}
