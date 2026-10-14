'use client'

import { useLanguage } from '@/context/LanguageContext'

export type InfoRow = { label: string; value: string }

/** What there is to know about a game before playing it: who made it, what kind it is, when it came out. */
export default function LibraryDetailInfo({ rows }: { rows: InfoRow[] }) {
  const { T } = useLanguage()
  if (rows.length === 0) return null

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-text-secondary text-sm px-1">{T.libraryDetail.infoTitle}</p>
      <dl className="flex flex-col gap-2 px-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-[11px] uppercase tracking-wide text-text-secondary shrink-0">{r.label}</dt>
            <dd className="text-sm font-medium text-right min-w-0 truncate" title={r.value}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
