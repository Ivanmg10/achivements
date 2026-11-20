'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'
import { LIBRARY_COLUMNS } from '@/components/library-toolbar/LibraryToolbar'

const ROWS = 8

/** The list's own shape: icon, title, platform, bar. Same height as a real row. */
function Row() {
  return (
    <div className="h-[92px] rounded-card bg-bg-card ring-1 ring-ink/5 p-2 pr-3 grid grid-cols-[52px_1fr] items-center gap-3">
      <Skeleton radius="tile" className="w-[52px] h-[52px]" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-1.5 w-full" />
      </div>
    </div>
  )
}

/** The open game's panel: its name and platform, the ring, the two panels beside it, the figures, the achievements. */
function Detail() {
  return (
    <div className="rounded-card bg-bg-card ring-1 ring-accent/30 p-4 flex flex-col gap-3 lg:min-h-[calc(100dvh-16.25rem)]">
      <div className="flex items-center gap-3">
        <Skeleton radius="tile" className="h-9 w-1/2" />
        <Skeleton radius="tile" className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[190px_1.3fr_1fr] gap-3">
        <div className="h-80 flex items-center justify-center">
          <Skeleton radius="circle" className="w-32 h-32" />
        </div>
        <Skeleton radius="tile" className="h-80" />
        <Skeleton radius="tile" className="h-80" />
        <div className="xl:col-span-3 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} radius="tile" className="h-[4.0625rem]" />
          ))}
        </div>
        <Skeleton radius="tile" className="h-72 xl:col-span-2" />
        <Skeleton radius="tile" className="h-72" />
      </div>
    </div>
  )
}

/**
 * The list with a game's panel beside it, while a status list loads: in the
 * page's own layout, under the header, so the real thing takes its place
 * where it stands. Announced once.
 */
export default function LibraryExplorerSkeleton() {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-4">
        {/* The title with the platform tabs and the count, then the search and the view buttons: as the page lays them out. */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-x-7 gap-y-3 min-w-0 max-w-full">
          <div className="flex flex-col gap-1 shrink-0">
            <Skeleton className="h-10 sm:h-[3.15rem] w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton radius="circle" className="h-[59px] lg:h-11 w-[30rem] max-w-full" />
        </div>
        <div className={`flex flex-col gap-3 lg:grid lg:gap-x-5 lg:items-start ${LIBRARY_COLUMNS}`}>
          <Skeleton radius="field" className="h-(--h-control) w-full" />
          <div className="flex items-center gap-2">
            <span className="hidden lg:block grow" />
            <Skeleton radius="tile" className="h-11 w-[11.5rem]" />
            <Skeleton radius="tile" className="h-11 w-[6.375rem] sm:w-[13rem]" />
          </div>
        </div>
        <div className={`grid grid-cols-1 ${LIBRARY_COLUMNS} gap-5 items-start`}>
          <div className="flex flex-col gap-px">
            {Array.from({ length: ROWS }, (_, i) => (
              <Row key={i} />
            ))}
          </div>
          <div className="hidden lg:block">
            <Detail />
          </div>
        </div>
      </div>
    </div>
  )
}
