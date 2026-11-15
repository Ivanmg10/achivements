'use client'

import { useLanguage } from '@/context/LanguageContext'
import GameInfoSkeletonTable from '@/components/game-info-skeleton/game-info-skeleton-table/GameInfoSkeletonTable'

/** What holds a game page's table's place while its achievements or trophies load. */
export default function GameTableLoading() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="w-full flex flex-col items-center">
      <span className="sr-only">{T.loadingPage.game}</span>
      <GameInfoSkeletonTable />
    </div>
  )
}
