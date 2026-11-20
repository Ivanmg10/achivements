'use client'

import { useLanguage } from '@/context/LanguageContext'
import GameInfoSkeletonTable from './game-info-skeleton-table/GameInfoSkeletonTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { MEDIA_BOX, MEDIA_GRID, MEDIA_ROWS } from '@/components/game-hero/game-hero-media/GameHeroMedia'
import { COVER_SLOT } from '@/components/game-hero/game-hero-cover/GameHeroCover'
import { PORTRAIT } from '@/utils/coverRatio'

/**
 * A game page (RA or Steam) while it loads, in the page's own layout: the
 * hero (box art, chips, title, progress, facts, buttons; tiles and
 * screenshots), then the achievements' card with its tabs and rows. It sits where the page will be, under the
 * bar, instead of covering the screen, and the content lands on the same
 * shapes. Announced once as loading; the shapes are hidden. The cover holds
 * the platform's usual shape (`ratio`, as `GameHeroCover` holds it): a 2:3
 * portrait by default, IGDB's 3:4 on Xbox, RA's box by console.
 */
export default function GameInfoSkeleton({ ratio = PORTRAIT }: { ratio?: number }) {
  const { T } = useLanguage()

  return (
    <main role="status" aria-busy="true" className="flex-1 flex flex-col items-center text-text-main">
      <span className="sr-only">{T.loadingPage.game}</span>

      <div aria-hidden="true" className="w-full max-w-[110rem] mx-auto flex flex-col items-center">
        <section className="w-full px-4 sm:px-8 lg:px-14 pt-6 lg:pt-10 flex flex-col lg:flex-row gap-6 lg:gap-9 items-start">
          <Skeleton radius="tile" className={COVER_SLOT} style={{ aspectRatio: String(ratio) }} />
          <div className="flex flex-col flex-1 min-w-0 gap-3.5 lg:pt-1.5 w-full min-h-[451px] lg:min-h-0">
            <div className="flex gap-2">
              <Skeleton radius="tag" className="h-6 w-28" />
              <Skeleton radius="tag" className="h-6 w-20" />
            </div>
            <Skeleton radius="tile" className="h-14 lg:h-[4.25rem] w-2/3" />
            <Skeleton className="h-2 w-full max-w-[38.75rem]" />
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-1">
              {[20, 28, 24, 20].map((w, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3" style={{ width: `${w * 0.25}rem` }} />
                  <Skeleton className="h-3.5" style={{ width: `${w * 0.3}rem` }} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2.5 mt-2">
              <Skeleton radius="button" className="h-11 w-44" />
              <Skeleton radius="button" className="h-11 w-40" />
            </div>
          </div>
          {/* As the hero's: from lg the column is as tall as the row, two pictures stacked in the room under the tiles. */}
          <div className="flex flex-col gap-3 w-full lg:w-[26.25rem] shrink-0 lg:self-stretch">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton radius="tile" className="h-[4.6875rem]" />
              <Skeleton radius="tile" className="h-[4.6875rem]" />
            </div>
            <div className={`${MEDIA_GRID} ${MEDIA_ROWS[1]}`}>
              <Skeleton radius="tile" className={`${MEDIA_BOX} lg:col-span-2`} />
              <Skeleton radius="tile" className={`${MEDIA_BOX} lg:col-span-2`} />
            </div>
          </div>
        </section>

        <GameInfoSkeletonTable />
      </div>
    </main>
  )
}
