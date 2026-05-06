'use client'

import { useRef } from 'react'

import { useResizableList } from '@/hooks/useResizableList'
import { useWantGamesPreview } from '@/hooks/useWantGamesPreview'
import { useLanguage } from '@/context/LanguageContext'
import { GameCardSkeleton } from '@/components/ui/GameCardSkeleton'

import Link from 'next/link'
import MainPageGamesList from '../main-page-games/main-page-games-list/MainPageGamesList'
import ConsoleSideList from '../console-side-list/ConsoleSideList'
import EmptyState from '@/components/empty-state/EmptyState'

const MAX_GAMES = 2
const CARD_HEIGHT_PX = 70
const HEADER_PX = 64
const FOOTER_PX = 0

export default function MainPageWantToPlay() {
  const sectionRef = useRef<HTMLElement>(null)
  const { wantGames, loading } = useWantGamesPreview()
  const visibleCount = useResizableList({ sectionRef, cardHeightPx: CARD_HEIGHT_PX, headerPx: HEADER_PX, footerPx: FOOTER_PX })
  const { T } = useLanguage()

  return (
    <section
      ref={sectionRef}
      className="main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 w-[95%] self-center mt-2 pt-2 pb-3 shrink-0">
        <Link href="/wantToPlay" className="text-3xl shrink-0 hover:underline underline-offset-2 decoration-white/40">{T.mainPage.wantToPlay}</Link>
        <ConsoleSideList slug="wantToPlay" />
      </div>
      <div className="flex flex-col items-center w-full flex-1 overflow-hidden">
        {loading ? (
          <div className="w-full">
            <GameCardSkeleton />
            <GameCardSkeleton />
          </div>
        ) : wantGames.length > 0 ? (
          <MainPageGamesList listGames={wantGames.slice(0, Math.min(visibleCount, MAX_GAMES))} />
        ) : (
          <EmptyState icon="🔖" title={T.mainPage.noWantToPlay} subtitle={T.mainPage.noWantToPlaySub} className="py-8" />
        )}
      </div>
    </section>
  )
}
