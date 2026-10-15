'use client'

import { useLanguage } from '@/context/LanguageContext'

/** The following list while it loads: rows in the shape of the users to come. */
export default function FollowingPageSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-1">
      <span className="sr-only">{T.following.loading}</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-xl bg-bg-main animate-pulse motion-reduce:animate-none" />
      ))}
    </div>
  )
}
