'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesByCategory } from '@/hooks/usePsnGamesByCategory'
import MainPagePlatformNav from '../main-page-platform-nav/MainPagePlatformNav'

/** PSN's side of the navigation card: its games per list. */
export default function MainPagePsnNav() {
  const { T } = useLanguage()
  return (
    <MainPagePlatformNav
      source="psn"
      empty={T.psn.noGamesInCategory}
      sections={{
        wantToPlay: usePsnGamesByCategory('wantToPlay'),
        playing: usePsnGamesByCategory('playing'),
        completed: usePsnGamesByCategory('completed'),
      }}
    />
  )
}
