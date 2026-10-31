'use client'

import { useLanguage } from '@/context/LanguageContext'
import GameInfoSkeletonTable from './game-info-skeleton-table/GameInfoSkeletonTable'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * A game page (RA or Steam) while it loads, in the page's own layout: the
 * hero (box art, chips, title, progress, facts, buttons; tiles and
 * screenshots), then the achievements' card with its tabs and rows. It sits where the page will be, under the
 * bar, instead of covering the screen, and the content lands on the same
 * shapes. Announced once as loading; the shapes are hidden.
 */
export default function GameInfoSkeleton() {
  const { T } = useLanguage()

  return (
    <main role="status" aria-busy="true" className="flex-1 flex flex-col items-center text-text-main">
      <span className="sr-only">{T.loadingPage.game}</span>

      <div aria-hidden="true" className="w-full flex flex-col items-center">
        <section className="w-full px-4 sm:px-8 lg:px-14 pt-6 lg:pt-10 flex flex-col lg:flex-row gap-6 lg:gap-9 items-start">
          <Skeleton radius="tile" className="w-32 sm:w-40 lg:w-[13.5rem] aspect-[216/306] shrink-0" />
          <div className="flex flex-col flex-1 min-w-0 gap-3.5 lg:pt-1.5 w-full">
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
          <div className="hidden lg:flex flex-col gap-3 w-[26.25rem] shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton radius="tile" className="h-[4.5rem]" />
              <Skeleton radius="tile" className="h-[4.5rem]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton radius="tile" className="aspect-[320/224]" />
              <Skeleton radius="tile" className="aspect-[320/224]" />
            </div>
          </div>
        </section>

        <GameInfoSkeletonTable />
      </div>
    </main>
  )
}
