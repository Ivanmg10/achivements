'use client'

import { useRef, useMemo } from 'react'

import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useResizableList } from '@/hooks/useResizableList'
import { useLanguage } from '@/context/LanguageContext'
import { GameCardSkeleton } from '@/components/ui/GameCardSkeleton'

import Link from 'next/link'
import MainPageGamesList from './main-page-games-list/MainPageGamesList'
import ConsoleSideList from '../console-side-list/ConsoleSideList'
import EmptyState from '@/components/empty-state/EmptyState'

const MAX_GAMES = 2
const CARD_HEIGHT_PX = 70
const HEADER_PX = 64
const FOOTER_PX = 0

export default function MainPageGames() {
  const sectionRef = useRef<HTMLElement>(null)
  const { listGames, isLoading } = useGamesInProgressPreview()
  const gamesKey = listGames.map((g) => g.GameID).join(',')
  // shuffle at display level so context list stays stable (needed for abandoned tracking)
  const shuffledGames = useMemo(
    () => [...listGames].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gamesKey]
  )
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
      <div className="flex items-center justify-between gap-2 w-[95%] self-center mt-2 pt-2 pb-3 shrink-0">
        <Link href="/playing" className="text-3xl shrink-0 hover:underline underline-offset-2 decoration-white/40">{T.mainPage.playing}</Link>
        <ConsoleSideList slug="playing" />
      </div>
      <div className="flex flex-col items-center w-full flex-1 overflow-hidden">
        {isLoading ? (
          <div className="w-full">
            <GameCardSkeleton />
            <GameCardSkeleton />
          </div>
        ) : shuffledGames.length > 0 ? (
          <MainPageGamesList listGames={shuffledGames.slice(0, visibleCount)} />
        ) : (
          <EmptyState icon="🎮" title={T.mainPage.noGamesInProgress} subtitle={T.mainPage.noGamesInProgressSub} className="py-8" />
        )}
      </div>
    </section>
  )
}
