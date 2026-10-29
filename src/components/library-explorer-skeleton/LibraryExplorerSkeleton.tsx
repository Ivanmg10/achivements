'use client'

import { useLanguage } from '@/context/LanguageContext'

const BLOCK = 'bg-ink/[0.06]'
const ROWS = 8
/** The first shelf runs over two rows of the widest grid, the next ones start below it. */
const FIRST_SHELF_CARDS = 8
const SHELF_CARDS = 4

/** The list's own shape: icon, title, platform, bar. Same height as a real row. */
function Row() {
  return (
    <div className="rounded-card bg-bg-card ring-1 ring-ink/5 p-2 pr-3 grid grid-cols-[52px_1fr] items-center gap-3">
      <div className={`${BLOCK} w-[52px] h-[52px] rounded-tile`} />
      <div className="flex flex-col gap-2">
        <div className={`${BLOCK} h-3.5 w-2/3 rounded`} />
        <div className={`${BLOCK} h-3 w-1/3 rounded`} />
        <div className={`${BLOCK} h-1.5 w-full rounded-full`} />
      </div>
    </div>
  )
}

/** The open game's panel: its name and platform, the ring, the two panels beside it, the figures, the achievements. */
function Detail() {
  return (
    <div className="rounded-card bg-bg-card ring-1 ring-accent/30 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`${BLOCK} h-9 w-1/2 rounded-lg`} />
        <div className={`${BLOCK} h-8 w-32 rounded-tile`} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[190px_1.3fr_1fr] gap-3">
        <div className={`${BLOCK} h-80 rounded-tile flex items-center justify-center`}>
          <div className="w-32 h-32 rounded-full border-[9px] border-bg-card" />
        </div>
        <div className={`${BLOCK} h-80 rounded-tile`} />
        <div className={`${BLOCK} h-80 rounded-tile`} />
        <div className="xl:col-span-3 flex flex-wrap gap-2">
          {[28, 32, 28, 36].map((w, i) => (
            <div key={i} className={`${BLOCK} h-14 rounded-tile`} style={{ width: `${w * 0.25}rem` }} />
          ))}
        </div>
        <div className={`${BLOCK} h-72 rounded-tile xl:col-span-2`} />
        <div className={`${BLOCK} h-72 rounded-tile`} />
      </div>
    </div>
  )
}

/** One shelf: its title and its cards. */
function Shelf({ cards = SHELF_CARDS }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`${BLOCK} h-5 w-48 rounded`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="rounded-card bg-bg-card ring-1 ring-ink/5 overflow-hidden">
            <div className={`${BLOCK} aspect-video`} />
            <div className="p-4 min-h-[7.25rem] flex flex-col justify-end gap-3">
              <div className={`${BLOCK} h-4 w-2/3 rounded`} />
              <div className={`${BLOCK} h-1.5 w-full rounded-full`} />
              <div className="flex justify-between">
                <div className={`${BLOCK} h-3 w-10 rounded`} />
                <div className={`${BLOCK} h-3 w-12 rounded`} />
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
      <div aria-hidden="true" className="flex flex-col gap-4 animate-pulse motion-reduce:animate-none">
        {/* The title with the platform tabs and the count, then the search and the view buttons: as the page lays them out. */}
        <div className="flex flex-col gap-1 pb-5 border-b border-bg-card mb-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`${BLOCK} h-8 w-40 rounded-lg`} />
            <div className={`${BLOCK} h-[38px] w-[26rem] max-w-full rounded-full`} />
          </div>
          <div className={`${BLOCK} h-4 w-24 rounded mt-1`} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`${BLOCK} h-[34px] w-full sm:w-[30rem] rounded-tile`} />
          <div className={`${BLOCK} h-8 w-[6.5rem] sm:w-[13.5rem] rounded-lg`} />
        </div>
        {layout === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,5fr)_minmax(0,7fr)] gap-4 items-start">
            <div className="flex flex-col gap-1.5">
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
