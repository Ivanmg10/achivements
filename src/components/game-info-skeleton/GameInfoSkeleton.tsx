'use client'

import { useLanguage } from '@/context/LanguageContext'
import GameInfoSkeletonTable from './game-info-skeleton-table/GameInfoSkeletonTable'

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
        <section className="w-full px-4 sm:px-8 lg:px-14 pt-6 lg:pt-10 flex flex-col lg:flex-row gap-6 lg:gap-9 items-start animate-pulse motion-reduce:animate-none">
          <div className="w-32 sm:w-40 lg:w-[13.5rem] aspect-[216/306] rounded-xl bg-ink/[0.07] shrink-0" />
          <div className="flex flex-col flex-1 min-w-0 gap-3.5 lg:pt-1.5 w-full">
            <div className="flex gap-2">
              <div className="h-6 w-28 rounded-[0.375rem] bg-ink/[0.07]" />
              <div className="h-6 w-20 rounded-[0.375rem] bg-ink/[0.06]" />
            </div>
            <div className="h-14 lg:h-[4.25rem] w-2/3 rounded-lg bg-ink/[0.09]" />
            <div className="h-2 w-full max-w-[38.75rem] bg-ink/[0.07]" />
            <div className="flex gap-8 mt-1">
              {[20, 28, 24, 20].map((w, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="h-3 rounded-full bg-ink/[0.05]" style={{ width: `${w * 0.25}rem` }} />
                  <div className="h-3.5 rounded-full bg-ink/[0.08]" style={{ width: `${w * 0.3}rem` }} />
                </div>
              ))}
            </div>
            <div className="flex gap-2.5 mt-2">
              <div className="h-11 w-44 rounded-control bg-ink/[0.08]" />
              <div className="h-11 w-40 rounded-control bg-ink/[0.05]" />
            </div>
          </div>
          <div className="hidden lg:flex flex-col gap-3 w-[26.25rem] shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="h-[4.5rem] rounded-xl bg-ink/[0.06]" />
              <div className="h-[4.5rem] rounded-xl bg-ink/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-[320/224] rounded-[0.625rem] bg-ink/[0.05]" />
              <div className="aspect-[320/224] rounded-[0.625rem] bg-ink/[0.05]" />
            </div>
          </div>
        </section>

        <GameInfoSkeletonTable />
      </div>
    </main>
  )
}
