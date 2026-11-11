'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import MainPagePlatformNav from '../main-page-platform-nav/MainPagePlatformNav'

/** Steam's side of the navigation card: its games per list. */
export default function MainPageSteamNav() {
  const { T } = useLanguage()
  return (
    <MainPagePlatformNav
      source="steam"
      empty={T.steam.noGamesInCategory}
      sections={{
        wantToPlay: useSteamGamesByCategory('wantToPlay'),
        playing: useSteamGamesByCategory('playing'),
        completed: useSteamGamesByCategory('completed'),
      }}
    />
  )
}
