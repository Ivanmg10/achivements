'use client'

import { useLanguage } from '@/context/LanguageContext'

/** The following list while it loads: cards in the shape of the people to come. */
export default function FollowingPageSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-3">
      <span className="sr-only">{T.following.loading}</span>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-44 rounded-tile bg-bg-card animate-pulse motion-reduce:animate-none" />
      ))}
    </div>
  )
}
