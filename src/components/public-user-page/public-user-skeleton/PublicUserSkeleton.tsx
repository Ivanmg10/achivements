'use client'

import MainPageSkeleton from '@/components/main-page/main-page-skeleton/MainPageSkeleton'

/** Another user's page while it loads: their header card, then the main page's own layout. */
export default function PublicUserSkeleton() {
  return (
    <div className="flex flex-col min-h-full text-text-main">
      <div aria-hidden="true" className="m-3 bg-bg-card rounded-xl p-4 flex items-start gap-4 animate-pulse motion-reduce:animate-none">
        <div className="rounded-full w-20 h-20 sm:w-24 sm:h-24 bg-ink/[0.08] shrink-0" />
        <div className="flex flex-col gap-2 flex-1 pt-1">
          <div className="h-8 w-48 rounded-lg bg-ink/[0.08]" />
          <div className="h-3.5 w-28 rounded bg-ink/[0.06]" />
          <div className="h-3.5 w-2/3 rounded bg-ink/[0.06]" />
        </div>
      </div>
      <MainPageSkeleton />
    </div>
  )
}
