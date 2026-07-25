'use client'

import { useRef, useMemo } from 'react'

import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useResizableList } from '@/hooks/useResizableList'
import { useLanguage } from '@/context/LanguageContext'
import { useMainView } from '@/context/MainViewContext'
import { GameCardSkeleton } from '@/components/ui/GameCardSkeleton'
import { IconHistory } from '@tabler/icons-react'

import Link from 'next/link'
import MainPageGamesList from './main-page-games-list/MainPageGamesList'
import ConsoleSideList from '../console-side-list/ConsoleSideList'
import EmptyState from '@/components/empty-state/EmptyState'
import { GameExtraData } from '@/components/statusGameList/StatusGameList'

const MAX_GAMES = 2
const CARD_HEIGHT_PX = 70
const HEADER_PX = 64
const FOOTER_PX = 0

export default function MainPageGames() {
  const sectionRef = useRef<HTMLElement>(null)
  const { listGames, isLoading } = useGamesInProgressPreview()
  const recentlyPlayed = useRecentlyPlayedGames()

  const extraDataMap = useMemo(() => {
    const map = new Map<number, GameExtraData>()
    for (const g of recentlyPlayed) {
      map.set(g.GameID, {
        awards: [],
        lastPlayed: g.LastPlayed,
        possibleScore: g.PossibleScore,
        scoreAchieved: g.ScoreAchieved,
        scoreAchievedHardcore: g.ScoreAchievedHardcore,
      })
    }
    return map
  }, [recentlyPlayed])

  const sortedGames = useMemo(() => {
    return [...listGames].sort((a, b) => {
      const aId = a.GameID ?? Number(a.ID)
      const bId = b.GameID ?? Number(b.ID)
      const aDate = extraDataMap.get(aId)?.lastPlayed ?? ''
      const bDate = extraDataMap.get(bId)?.lastPlayed ?? ''
      if (!aDate && !bDate) return 0
      if (!aDate) return 1
      if (!bDate) return -1
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }, [listGames, extraDataMap])

  const visibleCount = useResizableList({
    sectionRef,
    maxItems: MAX_GAMES,
    cardHeightPx: CARD_HEIGHT_PX,
    headerPx: HEADER_PX,
    footerPx: FOOTER_PX,
  })
  const { T } = useLanguage()
  const { setView } = useMainView()

  return (
    <section
      ref={sectionRef}
      className="main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 w-[95%] self-center mt-2 pt-2 pb-3 shrink-0">
        <Link href="/playing" className="text-3xl shrink-0 hover:underline underline-offset-2 decoration-white/40">{T.mainPage.playing}</Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('recent')}
            aria-label="Ver jugados recientemente"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-main hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconHistory className="w-4 h-4" aria-hidden />
          </button>
          <ConsoleSideList slug="playing" />
        </div>
      </div>
      <div className="flex flex-col items-center w-full flex-1 overflow-hidden">
        {isLoading ? (
          <div className="w-full">
            <GameCardSkeleton />
            <GameCardSkeleton />
          </div>
        ) : sortedGames.length > 0 ? (
          <MainPageGamesList listGames={sortedGames.slice(0, visibleCount)} extraData={extraDataMap} />
        ) : (
          <EmptyState icon="🎮" title={T.mainPage.noGamesInProgress} subtitle={T.mainPage.noGamesInProgressSub} className="py-8" />
        )}
      </div>
    </section>
  )
}
