'use client'

import { useLanguage } from '@/context/LanguageContext'

/** The groups list while it loads, in the shape of its cards. Announced once. */
export default function GroupListSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] animate-pulse motion-reduce:animate-none">
      <span className="sr-only">{T.loadingPage.title}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} aria-hidden="true" className="flex items-center gap-4 bg-bg-card rounded-card p-3">
          <div className="w-24 h-24 rounded-tile bg-ink/10 shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-3.5 w-40 rounded bg-ink/10" />
            <div className="h-2.5 w-24 rounded bg-ink/10" />
          </div>
        </div>
      ))}
    </div>
  )
}
