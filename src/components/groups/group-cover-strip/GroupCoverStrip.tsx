'use client'

import { useState } from 'react'
import { sharpEnough } from '@/utils/homeHero'

/**
 * One cover of the strip. A picture big enough for its slice fills it; one that would be stretched into a
 * blur (an RA box of 96 px in a 230 px band: `sharpEnough`, at most twice its size) is drawn at that size
 * at most, centred over a blurred copy of itself, so the slice is still full and nothing is smeared.
 */
function GroupCoverSlice({ src }: { src: string }) {
  const [natural, setNatural] = useState<[number, number] | null>(null)
  const check = (img: HTMLImageElement | null) => {
    if (!img?.complete || !img.naturalWidth || natural) return
    if (!sharpEnough(img.naturalWidth, img.naturalHeight, img.clientWidth, img.clientHeight)) setNatural([img.naturalWidth, img.naturalHeight])
  }

  return (
    <div className="relative min-w-0 overflow-hidden bg-bg-main">
      {natural && <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-60" />}
      <img
        ref={check}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={(e) => check(e.currentTarget)}
        className={natural ? 'absolute inset-0 m-auto max-w-full max-h-full object-contain' : 'w-full h-full object-cover'}
        style={natural ? { width: natural[0] * 2, height: natural[1] * 2 } : undefined}
      />
    </div>
  )
}

/**
 * A group's banner: the band split between its games' covers, one slice each (up to four), as the group's
 * album card and the landing's example groups draw it. Decorative; the card names the group. Fills its parent.
 */
export default function GroupCoverStrip({ covers }: { covers: string[] }) {
  const shown = covers.slice(0, 4)
  return (
    <div aria-hidden="true" className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
      {shown.map((src, i) => (
        <GroupCoverSlice key={`${i}-${src}`} src={src} />
      ))}
    </div>
  )
}
