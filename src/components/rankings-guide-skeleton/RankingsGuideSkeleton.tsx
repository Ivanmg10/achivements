'use client'

import type { CSSProperties } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'

/** The guide's sections on a phone and on a desktop, in px, measured 2026-10-31 in English: they run this tall once the text is in. */
const SECTIONS = [[303, 175], [665, 494], [517, 362], [501, 316], [593, 439], [430, 290], [681, 472], [589, 394]]
const CARD = 'rounded-card bg-bg-card ring-1 ring-inset ring-ink/[0.06]'

/** "How Vault Points work" while it arrives: the hero, then its sections of text and tables. Announced once. */
export default function RankingsGuideSkeleton() {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-6">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className={`${CARD} p-6 sm:p-10 flex flex-col gap-4 min-h-[503px] sm:min-h-[403px]`}>
        <Skeleton className="h-5 w-32" />
        <Skeleton radius="tile" className="h-12 sm:h-[4.5rem] w-3/4" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-5 w-2/3 max-w-xl" />
        <Skeleton radius="tile" className="h-16 w-full max-w-2xl" />
      </div>
      {SECTIONS.map(([phone, desktop], i) => (
        <div key={i} aria-hidden="true" className={`${CARD} p-6 flex flex-col gap-3 min-h-(--phone) sm:min-h-(--desktop)`} style={{ '--phone': `${phone}px`, '--desktop': `${desktop}px` } as CSSProperties}>
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton radius="pane" className="flex-1 mt-1" />
        </div>
      ))}
    </div>
  )
}
