'use client'

import { useRef } from 'react'

import { useResizableList } from '@/hooks/useResizableList'
import { useWantGamesPreview } from '@/hooks/useWantGamesPreview'
import { useLanguage } from '@/context/LanguageContext'

import Spinner from '@/components/main-spinner/Spinner'
import MainPageGamesList from '../main-page-games/main-page-games-list/MainPageGamesList'
import ConsoleSideList from '../console-side-list/ConsoleSideList'

const MAX_GAMES = 2
const CARD_HEIGHT_PX = 70
const HEADER_PX = 88
const FOOTER_PX = 0

export default function MainPageWantToPlay() {
  const sectionRef = useRef<HTMLElement>(null)
  const { wantGames, error } = useWantGamesPreview()
  const visibleCount = useResizableList({ sectionRef, cardHeightPx: CARD_HEIGHT_PX, headerPx: HEADER_PX, footerPx: FOOTER_PX })
  const { T } = useLanguage()

  if (error) return <p>Error: {error}</p>
  return (
    <section
      ref={sectionRef}
      className="main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-1.5 w-[95%] self-center mt-2 pt-2 pb-3 shrink-0">
        <h1 className="text-3xl">{T.mainPage.wantToPlay}</h1>
        <ConsoleSideList slug="wantToPlay" />
      </div>
      <div className="flex flex-col items-center w-full overflow-hidden">
        {wantGames.length > 0 ? (
          <MainPageGamesList listGames={wantGames.slice(0, Math.min(visibleCount, MAX_GAMES))} />
        ) : (
          <Spinner size={45} />
        )}
      </div>
    </section>
  )
}
