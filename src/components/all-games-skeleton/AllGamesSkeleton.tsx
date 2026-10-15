'use client'

import { useLanguage } from '@/context/LanguageContext'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'

const SECTIONS = 3
const ROWS = 3

/** The all-games page while it loads: the three sections (want to play, playing, completed) with their rows. Announced once. */
export default function AllGamesSkeleton() {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-4 animate-pulse motion-reduce:animate-none">
        {Array.from({ length: SECTIONS }, (_, s) => (
          <div key={s} className="w-full bg-bg-card rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="h-6 w-36 rounded-lg bg-ink/[0.08]" />
              <div className="h-5 w-10 rounded-full bg-ink/[0.06]" />
            </div>
            <div className="border-t border-bg-main p-4 flex flex-col gap-2">
              {Array.from({ length: ROWS }, (_, i) => (
                <GameRowSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
