'use client'

import { useRef } from 'react'

import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useResizableList } from '@/hooks/useResizableList'
import { useLanguage } from '@/context/LanguageContext'

import MainPageGamesList from './main-page-games-list/MainPageGamesList'
import ConsoleSideList from '../console-side-list/ConsoleSideList'

const MAX_GAMES = 2
const CARD_HEIGHT_PX = 70
const HEADER_PX = 88
const FOOTER_PX = 0

export default function MainPageGames() {
  const sectionRef = useRef<HTMLElement>(null)
  const { listGames } = useGamesInProgressPreview()
  const visibleCount = useResizableList({
    sectionRef,
    maxItems: MAX_GAMES,
    cardHeightPx: CARD_HEIGHT_PX,
    headerPx: HEADER_PX,
    footerPx: FOOTER_PX,
  })
  const { T } = useLanguage()

  return (
    <section
      ref={sectionRef}
      className="main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-1.5 w-[95%] self-center mt-2 pt-2 pb-3 shrink-0">
        <h1 className="text-3xl">{T.mainPage.playing}</h1>
        <ConsoleSideList slug="playing" />
      </div>
      <div className="flex flex-col items-center w-full overflow-hidden">
        {listGames.length > 0 ? (
          <MainPageGamesList listGames={listGames.slice(0, visibleCount)} />
        ) : (
          <p className="text-gray-400 text-sm w-[95%] px-2">{T.mainPage.noGamesInProgress}</p>
        )}
      </div>
    </section>
  )
}
