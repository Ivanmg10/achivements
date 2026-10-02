'use client'

import { useLanguage } from '@/context/LanguageContext'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'

const ROWS = 7
const STATS = 6
const SECTIONS = 5

/**
 * The home page's own layout, empty, while the session is read: the recent
 * games on the left, the profile on the right, Stats & Activity below. It
 * sits where the page will be, so the bar and footer stay put and nothing is
 * covered. Announced once as loading; the shapes themselves are hidden.
 */
export default function MainPageSkeleton() {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="flex flex-col animate-pulse motion-reduce:animate-none">
      <span className="sr-only">{T.loadingPage.title}</span>

      <div aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
        {/* Profile: first on a phone, right column on desktop, like the page. */}
        <div className="lg:col-start-2 lg:row-start-1 m-3 bg-bg-card rounded-xl p-4 flex flex-col gap-3">
          <div className="h-8 w-56 rounded-lg bg-white/[0.04]" />
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-xl bg-white/[0.06]" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-5 w-1/2 rounded-full bg-white/[0.08]" />
              <div className="h-3 w-1/3 rounded-full bg-white/[0.05]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-16 rounded-lg bg-bg-main" />
            ))}
          </div>
          {/* Same heights as the real blocks (playing now, recent achievements), so the swap does not move the page. */}
          <div className="h-40 rounded-lg bg-bg-main" />
          <div className="h-[264px] rounded-lg bg-bg-main" />
        </div>

        <div className="lg:col-start-1 lg:row-start-1 m-3 bg-bg-card rounded-xl p-4 flex flex-col gap-2">
          <div className="h-7 w-48 rounded-full bg-white/[0.08] mb-1" />
          {Array.from({ length: ROWS }, (_, i) => (
            <GameRowSkeleton key={i} />
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="p-4 flex flex-col gap-4">
        <div className="h-6 w-40 rounded-full bg-white/[0.08]" />
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(180px,220px)_1fr] gap-4">
          <div className="flex lg:flex-col gap-1 lg:bg-bg-card lg:rounded-2xl lg:p-2">
            {Array.from({ length: SECTIONS }, (_, i) => (
              <div key={i} className="h-10 w-28 lg:w-full rounded-xl bg-white/[0.05] shrink-0" />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {Array.from({ length: STATS }, (_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/[0.04]" />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="h-64 rounded-xl bg-bg-card xl:col-span-2" />
              <div className="h-64 rounded-xl bg-bg-card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
