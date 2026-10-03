'use client'

import { useLanguage } from '@/context/LanguageContext'
import GameInfoSkeletonTable from './game-info-skeleton-table/GameInfoSkeletonTable'

/**
 * A game page (RA or Steam) while it loads, in the page's own layout: the
 * header (box art, title, chips, progress, details, screenshots), the filter
 * tabs and the achievement rows. It sits where the page will be, under the
 * bar, instead of covering the screen, and the content lands on the same
 * shapes. Announced once as loading; the shapes are hidden.
 */
export default function GameInfoSkeleton() {
  const { T } = useLanguage()

  return (
    <main role="status" aria-busy="true" className="flex-1 flex flex-col items-center text-text-main">
      <span className="sr-only">{T.loadingPage.game}</span>

      <div aria-hidden="true" className="w-full flex flex-col items-center">
        <section className="p-5 rounded-xl min-w-[95%] grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 mt-5 animate-pulse motion-reduce:animate-none">
          <div className="flex flex-row items-start gap-5">
            <div className="w-28 lg:w-50 aspect-[3/4] rounded-xl bg-white/[0.07] shrink-0" />
            <div className="flex flex-col flex-1 min-w-0 gap-3">
              <div className="h-8 w-2/3 rounded-lg bg-white/[0.09]" />
              <div className="flex gap-2">
                <div className="h-6 w-28 rounded-md bg-white/[0.06]" />
                <div className="h-6 w-20 rounded-md bg-white/[0.05]" />
              </div>
              <div className="h-2 w-64 max-w-full rounded-full bg-white/[0.06] mt-1" />
              <div className="flex flex-col gap-2 mt-1">
                {[40, 56, 48, 60, 36].map((w, i) => (
                  <div key={i} className="h-3 rounded-full bg-white/[0.05]" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-4">
            <div className="flex gap-2">
              <div className="h-12 w-36 rounded-xl bg-white/[0.06]" />
              <div className="h-12 w-28 rounded-xl bg-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="aspect-4/3 rounded-md bg-white/[0.05]" />
              <div className="aspect-4/3 rounded-md bg-white/[0.05]" />
            </div>
          </div>
        </section>

        <div className="w-[95%] flex gap-2 mt-2 animate-pulse motion-reduce:animate-none">
          {[12, 16, 20].map((w, i) => (
            <div key={i} className="h-8 rounded-full bg-white/[0.06]" style={{ width: `${w * 0.25}rem` }} />
          ))}
        </div>

        <GameInfoSkeletonTable />
      </div>
    </main>
  )
}
