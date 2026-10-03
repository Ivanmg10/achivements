'use client'

import { useLanguage } from '@/context/LanguageContext'

const CARDS = 6
const GRID: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 lg:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}

/**
 * A status list (want to play, playing, completed) while it loads, in the
 * page's own layout: the header with its controls, the console chips, and
 * cards shaped like the real ones (cover, title, chips, counts). It sits
 * where the list will be instead of covering the screen. Announced once.
 */
export default function StatusPageSkeleton({ cols = 2 }: { cols?: number }) {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-3 animate-pulse motion-reduce:animate-none">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="h-8 w-56 rounded-lg bg-ink/[0.08]" />
          <div className="flex gap-2">
            <div className="h-9 w-48 rounded-xl bg-ink/[0.05]" />
            <div className="h-9 w-28 rounded-xl bg-ink/[0.05]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 py-1">
          {[20, 24, 16, 28, 20].map((w, i) => (
            <div key={i} className="h-7 rounded-md bg-ink/[0.05]" style={{ width: `${w * 0.25}rem` }} />
          ))}
        </div>
        <div className={`grid gap-2 ${GRID[cols] ?? GRID[2]}`}>
          {Array.from({ length: CARDS }, (_, i) => (
            <div key={i} className="bg-bg-card rounded-2xl ring-1 ring-ink/5 p-4 sm:p-5 flex items-start gap-3 sm:gap-5">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl bg-ink/[0.07] shrink-0" />
              <div className="flex flex-col gap-2.5 flex-1 min-w-0 pt-1">
                <div className="h-5 w-2/3 rounded-full bg-ink/[0.08]" />
                <div className="h-4 w-24 rounded-md bg-ink/[0.06]" />
                <div className="h-3 w-28 rounded-full bg-ink/[0.05]" />
                <div className="h-2.5 w-20 rounded-full bg-ink/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
