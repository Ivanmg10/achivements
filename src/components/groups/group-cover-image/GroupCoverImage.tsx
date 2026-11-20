'use client'

import { useState } from 'react'
import { sharpEnough } from '@/utils/homeHero'

/**
 * A game's art in a group, filling its box: the first of `sources` that loads (each failed one steps to the
 * next: Steam's cover, its header, then its icon, `coverSources`). A portrait is cut from its top, where the title
 * is. A picture too small for the box (a 32 px Steam client icon, an RA box of 96 px in a 230 px band:
 * `sharpEnough`, at most twice its size) is drawn at that size at most, centred over a blurred copy of itself,
 * so the box is still full and nothing is smeared. Decorative.
 */
export default function GroupCoverImage({ sources, className = '' }: { sources: readonly string[]; className?: string }) {
  const [index, setIndex] = useState(0)
  const [natural, setNatural] = useState<[number, number] | null>(null)
  const src = sources[index]
  const check = (img: HTMLImageElement | null) => {
    if (!img?.complete || !img.naturalWidth || natural) return
    if (!sharpEnough(img.naturalWidth, img.naturalHeight, img.clientWidth, img.clientHeight)) setNatural([img.naturalWidth, img.naturalHeight])
  }

  return (
    <div aria-hidden="true" className={`relative min-w-0 overflow-hidden bg-bg-main ${className}`}>
      {src && natural && <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-60" />}
      {src && (
        <img
          key={src}
          ref={check}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={(e) => check(e.currentTarget)}
          onError={() => {
            setNatural(null)
            setIndex((i) => i + 1)
          }}
          className={natural ? 'absolute inset-0 m-auto max-w-full max-h-full object-contain' : 'w-full h-full object-cover object-top'}
          style={natural ? { width: natural[0] * 2, height: natural[1] * 2 } : undefined}
        />
      )}
    </div>
  )
}
