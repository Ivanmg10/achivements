'use client'

import { useCallback, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { PORTRAIT } from '@/utils/coverRatio'
import { SKELETON_PULSE } from '@/components/ui/Skeleton'

/** The cover's width on every game page; the picture is never wider than this, nor than its own pixels. */
export const COVER_SLOT = 'w-32 sm:w-40 lg:w-[13.5rem] shrink-0'

export type GameHeroCoverProps = {
  /** The pictures to try, best first: one that fails steps to the next (Steam's cover, its header, its icon). */
  sources: (string | null | undefined)[]
  alt: string
  /** The box's shape until the picture's size is known, width over height (`PORTRAIT`, `IGDB_COVER`, `raBoxRatio`). */
  ratio?: number
  /** Still finding the best picture (IGDB's cover is on its way): the box waits, so no icon is swapped for it. */
  pending?: boolean
  /** Through Next's optimizer (RA's host); the other hosts are shown as they come. */
  optimized?: boolean
  /** Shown when every picture fails, or there is none. */
  fallback?: ReactNode
}

/**
 * The game hero's cover, the one way the four game pages draw it (#167, #203). Every picture is shown at its own
 * ratio, the same width on the four pages, its height from the picture: never cropped, never letterboxed. A
 * picture narrower than that width (a small square icon while no cover exists) stays at its own size, never
 * blown up. The box holds a pulsing placeholder in the source's usual shape until the picture is in.
 */
export default function GameHeroCover({ sources, alt, ratio = PORTRAIT, pending = false, optimized = false, fallback }: GameHeroCoverProps) {
  const list = sources.filter((s): s is string => !!s)
  const [index, setIndex] = useState(0)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  // A cached picture can finish before React attaches onLoad: read it on mount.
  const seen = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setSize({ w: img.naturalWidth, h: img.naturalHeight })
  }, [setSize])

  useWhenChanged([list.join('\n')], () => {
    setIndex(0)
    setSize(null)
  })

  const src = pending ? undefined : list[index]
  const frame = 'relative rounded-tile overflow-hidden shadow-[0_24px_60px_rgb(0_0_0/0.55)] ring-1 ring-inset ring-ink/10'
  const style = { aspectRatio: String(size ? size.w / size.h : ratio), maxWidth: size ? `${size.w}px` : undefined }

  return (
    <div className={`${COVER_SLOT} enter-rise`}>
      {!src && !pending ? (
        <div className={frame} style={style}>
          {fallback ?? <span aria-hidden="true" className="block w-full h-full bg-ink/10" />}
        </div>
      ) : (
        <div className={`${frame} ${size ? '' : `bg-skeleton ${SKELETON_PULSE}`}`} style={style} data-cover={size ? 'loaded' : 'loading'}>
          {src && (
            <Image
              key={src}
              ref={seen}
              src={src}
              alt={alt}
              fill
              sizes="(min-width: 1024px) 216px, 160px"
              // Often the page's largest picture on load: fetched at once, not when scrolled to.
              loading="eager"
              unoptimized={!optimized}
              onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              onError={() => {
                setSize(null)
                setIndex((i) => i + 1)
              }}
              className={`object-cover transition-opacity duration-300 ${size ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
        </div>
      )}
    </div>
  )
}
