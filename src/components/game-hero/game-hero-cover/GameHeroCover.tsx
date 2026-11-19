'use client'

import { useCallback, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { SKELETON_PULSE } from '@/components/ui/Skeleton'

/** The frame of Steam, PlayStation and Xbox: a portrait the shape of Steam's and IGDB's covers. */
const FRAME = 2 / 3
/** How far from 2:3 a picture may be and still cover the frame (Steam's 600×900, IGDB's 264×374 are within). */
const FITS = 0.06
/** RA's box before its size is known: a PS2 or GameCube box, the most common shape. */
const BOX = 0.71

export type GameHeroCoverProps = {
  /** The pictures to try, best first: one that fails steps to the next (Steam's cover, its header, its icon). */
  sources: (string | null | undefined)[]
  alt: string
  /** RA: the box at its own ratio, never cropped (each console's box has its own shape). */
  natural?: boolean
  /** RA: the box's shape until the picture's size is known (`raBoxRatio`), width over height. */
  ratio?: number
  /** Still finding the best picture (IGDB's cover is on its way): the box waits, so no icon is swapped for it. */
  pending?: boolean
  /** Through Next's optimizer (RA's host); the other hosts are shown as they come. */
  optimized?: boolean
  /** Shown when every picture fails, or there is none. */
  fallback?: ReactNode
}

/**
 * The game hero's cover, the one way the four game pages draw it (#167). Steam, PlayStation and Xbox share a
 * 2:3 frame, the same size on the three: a portrait covers it; any other shape (a square icon while no cover is
 * found, Steam's wide header) is shown whole, centred over a blurred, darkened copy of itself that fills the
 * frame, as Steam's library does. RA (`natural`) shows its box at the box's own ratio, the same width, never
 * cropped. The box holds a pulsing placeholder in its shape until the picture is in.
 */
export default function GameHeroCover({ sources, alt, natural = false, ratio = BOX, pending = false, optimized = false, fallback }: GameHeroCoverProps) {
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
  const shape = size ? size.w / size.h : null
  const fits = shape !== null && Math.abs(shape - FRAME) <= FITS
  const box = `relative w-32 sm:w-40 lg:w-[13.5rem] shrink-0 rounded-tile overflow-hidden shadow-[0_24px_60px_rgb(0_0_0/0.55)] ring-1 ring-inset ring-ink/10 enter-rise ${natural ? '' : 'aspect-2/3'}`
  const style = natural ? { aspectRatio: String(shape ?? ratio) } : undefined

  if (!src && !pending) {
    return (
      <div className={box} style={style}>
        {fallback ?? <span aria-hidden="true" className="block w-full h-full bg-ink/10" />}
      </div>
    )
  }

  return (
    <div className={`${box} ${size ? '' : `bg-skeleton ${SKELETON_PULSE}`}`} style={style} data-cover-fit={size ? (natural || fits ? 'cover' : 'contain') : undefined}>
      {src && size && !natural && !fits && (
        <Image src={src} alt="" aria-hidden="true" fill sizes="216px" unoptimized={!optimized} className="object-cover scale-125 blur-xl brightness-[0.45]" />
      )}
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
          className={`${natural || fits || !size ? 'object-cover' : 'object-contain'} transition-opacity duration-300 ${size ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
