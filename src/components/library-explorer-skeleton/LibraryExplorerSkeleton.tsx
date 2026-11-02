'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'

const ROWS = 8
/** The first shelf runs over two rows of the widest grid, the next ones start below it. */
const FIRST_SHELF_CARDS = 8
const SHELF_CARDS = 4

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
        <div className="xl:col-span-3 flex flex-wrap gap-2">
          {[28, 32, 28, 36].map((w, i) => (
            <Skeleton key={i} radius="tile" className="h-14" style={{ width: `${w * 0.25}rem` }} />
          ))}
        </div>
        <Skeleton radius="tile" className="h-72 xl:col-span-2" />
        <Skeleton radius="tile" className="h-72" />
      </div>
    </div>
  )
}

/** One shelf: its title and its cards. */
function Shelf({ cards = SHELF_CARDS }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="rounded-card bg-bg-card ring-1 ring-ink/5 overflow-hidden">
            <Skeleton radius="none" className="aspect-video" />
            <div className="p-4 min-h-[7.25rem] flex flex-col justify-end gap-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-1.5 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The shelves, or the list with a game's panel beside it, while a status list
 * loads: in the page's own layout, under the header, so the real thing takes
 * its place where it stands. Announced once.
 */
export default function LibraryExplorerSkeleton({ layout }: { layout: 'shelves' | 'list' }) {
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
        <div className="flex items-center gap-3 flex-wrap">
          <Skeleton radius="field" className="h-[3.25rem] w-full sm:w-[21.25rem]" />
          <span className="hidden sm:block grow" />
          {layout === 'list' && <Skeleton radius="tile" className="h-11 w-[11.5rem]" />}
          <Skeleton radius="tile" className="h-10 w-[16rem] sm:w-[18.375rem]" />
        </div>
        {layout === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(22rem,37rem)_minmax(0,1fr)] gap-5 items-start">
            <div className="flex flex-col gap-px">
              {Array.from({ length: ROWS }, (_, i) => (
                <Row key={i} />
              ))}
            </div>
            <div className="hidden lg:block">
              <Detail />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <Shelf cards={FIRST_SHELF_CARDS} />
            <Shelf />
          </div>
        )}
      </div>
    </div>
  )
}
