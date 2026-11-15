'use client'

import type { CSSProperties } from 'react'

/**
 * One cover of the art wall: the game's box in a small frame, tilted as the wall
 * lays it. The sign-in's sliding columns, the landing's backdrop and its closing
 * band draw their covers with it. Decoration: no alt, hidden from assistive tech,
 * never ahead of the page's own requests, and a dead picture hides instead of
 * leaving a broken icon. `size` is the picture's size classes; `style` places and
 * turns the tile; `hover` lifts it under the pointer (the sign-in's wall).
 */
export default function CoverTile({ src, size, style, hover = false }: { src: string; size: string; style?: CSSProperties; hover?: boolean }) {
  return (
    <div data-tile style={style}>
      <div className={`bg-bg-tertiary p-1.5 rounded-tile shadow-2xl border border-ink/10 ${hover ? 'hover:scale-110 hover:shadow-accent/25 transition-transform duration-200' : ''}`}>
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={`object-cover rounded-box ${size}`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onError={(e) => {
            e.currentTarget.style.visibility = 'hidden'
          }}
        />
      </div>
    </div>
  )
}
