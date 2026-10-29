'use client'

import { useLanguage } from '@/context/LanguageContext'

/** A user's page while it loads, in its own shape: the hero with its numbers, the tabs, then the first section. */
export default function PublicUserSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="min-h-full flex flex-col items-center py-4 sm:py-6 px-4">
      <span className="sr-only">{T.userProfile.loadingProfile}</span>
      <div aria-hidden="true" className="w-full lg:max-w-[95%] flex flex-col gap-4 animate-pulse motion-reduce:animate-none">
        <div className="bg-bg-card rounded-card px-4 sm:px-6 pt-6 pb-5 flex flex-col gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="rounded-full w-20 h-20 sm:w-28 sm:h-28 bg-ink/[0.08] shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-8 w-48 max-w-full rounded-lg bg-ink/[0.08]" />
              <div className="h-3.5 w-28 rounded bg-ink/[0.06]" />
              <div className="h-6 w-56 max-w-full rounded-full bg-ink/[0.06]" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-24 rounded-card bg-bg-main" />
            ))}
          </div>
        </div>
        <div className="flex gap-5 border-b border-ink/5 pb-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-20 rounded bg-ink/[0.08]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <div className="h-[30rem] lg:h-[34rem] rounded-tile bg-bg-card" />
          <div className="h-80 lg:h-[34rem] rounded-tile bg-bg-card" />
        </div>
      </div>
    </div>
  )
}
