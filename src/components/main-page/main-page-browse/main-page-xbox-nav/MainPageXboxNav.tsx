'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import MainPagePlatformNav from '../main-page-platform-nav/MainPagePlatformNav'

/** Xbox's side of the navigation card: its games per list. */
export default function MainPageXboxNav() {
  const { T } = useLanguage()
  return (
    <MainPagePlatformNav
      source="xbox"
      empty={T.xbox.noGamesInCategory}
      sections={{
        wantToPlay: useXboxGamesByCategory('wantToPlay'),
        playing: useXboxGamesByCategory('playing'),
        completed: useXboxGamesByCategory('completed'),
      }}
    />
  )
}
