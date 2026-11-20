'use client'

import { useLanguage } from '@/context/LanguageContext'
import Kicker from '@/components/ui/Kicker'
import { Skeleton } from '@/components/ui/Skeleton'

export type InfoRow = { label: string; value: string }

const SKELETON_ROWS = 4

/** What there is to know about a game before playing it: who made it, what kind it is, when it came out. */
export default function LibraryDetailInfo({ rows, isLoading = false }: { rows: InfoRow[]; isLoading?: boolean }) {
  const { T } = useLanguage()
  if (rows.length === 0 && !isLoading) return null

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-text-secondary text-sm px-1">{T.libraryDetail.infoTitle}</p>
      {isLoading ? (
        <div aria-hidden="true" className="flex flex-col gap-2 px-1 text-sm">
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-[1lh] w-20" />
              <Skeleton className="h-[1lh] w-28" />
            </div>
          ))}
        </div>
      ) : (
        <dl className="flex flex-col gap-2 px-1">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3">
              <Kicker as="dt" className="shrink-0">{r.label}</Kicker>
              <dd className="text-sm font-medium text-right min-w-0 truncate" title={r.value}>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
