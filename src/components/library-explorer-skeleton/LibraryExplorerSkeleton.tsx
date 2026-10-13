'use client'

import { useLanguage } from '@/context/LanguageContext'

const BLOCK = 'bg-ink/[0.06]'
const ROWS = 8
const SHELF_CARDS = 4

/** The list's own shape: icon, title, platform, bar. Same height as a real row. */
function Row() {
  return (
    <div className="rounded-2xl bg-bg-card ring-1 ring-ink/5 p-2 pr-3 grid grid-cols-[52px_1fr] items-center gap-3">
      <div className={`${BLOCK} w-[52px] h-[52px] rounded-xl`} />
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
    <div className="rounded-2xl bg-bg-card ring-1 ring-accent/30 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`${BLOCK} h-9 w-1/2 rounded-lg`} />
        <div className={`${BLOCK} h-8 w-32 rounded-xl`} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[190px_1.3fr_1fr] gap-3">
        <div className={`${BLOCK} h-80 rounded-xl flex items-center justify-center`}>
          <div className="w-32 h-32 rounded-full border-[9px] border-bg-card" />
        </div>
        <div className={`${BLOCK} h-80 rounded-xl`} />
        <div className={`${BLOCK} h-80 rounded-xl`} />
        <div className="xl:col-span-3 flex flex-wrap gap-2">
          {[28, 32, 28, 36].map((w, i) => (
            <div key={i} className={`${BLOCK} h-14 rounded-xl`} style={{ width: `${w * 0.25}rem` }} />
          ))}
        </div>
        <div className={`${BLOCK} h-72 rounded-xl xl:col-span-2`} />
        <div className={`${BLOCK} h-72 rounded-xl`} />
      </div>
    </div>
  )
}

/** One shelf: its title and a row of cards. */
function Shelf() {
  return (
    <div className="flex flex-col gap-3">
      <div className={`${BLOCK} h-5 w-48 rounded`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: SHELF_CARDS }, (_, i) => (
          <div key={i} className="rounded-2xl bg-bg-card ring-1 ring-ink/5 overflow-hidden">
            <div className={`${BLOCK} aspect-video`} />
            <div className="p-4 flex flex-col gap-3">
              <div className={`${BLOCK} h-4 w-2/3 rounded`} />
              <div className={`${BLOCK} h-1.5 w-full rounded-full`} />
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
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className={`${BLOCK} h-9 w-64 rounded-lg`} />
          <div className="flex gap-2 flex-wrap">
            <div className={`${BLOCK} h-9 w-48 rounded-xl`} />
            <div className={`${BLOCK} h-9 w-44 rounded-lg`} />
          </div>
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
            <Shelf />
            <Shelf />
          </div>
        )}
      </div>
    </div>
  )
}
