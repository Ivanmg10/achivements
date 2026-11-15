'use client'

import { useMemo } from 'react'
import { useIsClient } from '@/hooks/useIsClient'
import { ART_WALL_RA, ART_WALL_STEAM, WALL_TILTS, dealBothPlatforms } from '@/utils/artWall'
import CoverTile from '@/components/cover-tile/CoverTile'

const COLUMNS = 4
/**
 * How many of the pool are on screen. Steam cover art is ~65 KB a piece and
 * there is no smaller portrait on their CDN, so this is the knob that decides
 * what a visit weighs: 32 tiles ≈ 1.3 MB, all of it behind the form.
 */
const TILES_SHOWN = 32
/** Seconds per full pass, one per column: slow enough to read, never matching. */
const COLUMN_SECONDS = [118, 146, 104, 132]
/** Head start per column, so tiles never line up as a grid. */
const COLUMN_OFFSETS = ['-11rem', '4rem', '-6rem', '9rem']
/**
 * How far a tile leans off its column's centre line, as a multiple of --zig.
 * The panel sets --zig per breakpoint, so a narrow panel leans less and the
 * art never lands outside it.
 */
const ZIGZAG = [1, 0.8, 1.1, 0.9]

// The wall's extra look from 2560 px (full class names, so Tailwind finds them).
const WALL = {
  ground: 'bg-bg-card uhd:bg-bg-main uhd:[--zig:4.5rem]',
  glow: 'uhd:hidden',
  gap: 'uhd:gap-28',
  tile: 'uhd:w-32 uhd:h-32',
}

/** Alternating lean, so a column reads as a zig-zag rather than a straight line. */
function zigzag(column: number, i: number) {
  const side = (i + column) % 2 === 0 ? -1 : 1
  return side * ZIGZAG[i % ZIGZAG.length]
}

const shuffle = (list: string[]) => [...list].sort(() => Math.random() - 0.5)

/** Round-robin split, so each column holds a different set of games. */
function intoColumns(images: string[]): string[][] {
  const columns: string[][] = Array.from({ length: COLUMNS }, () => [])
  images.forEach((src, i) => columns[i % COLUMNS].push(src))
  return columns
}

/**
 * The art wall beside the sign-in and register forms: columns of game boxes
 * sliding past each other, the odd ones going up and the even ones down, each
 * at its own speed.
 *
 * Every visit deals a different hand from the pool, and each column's content
 * is doubled so the loop never shows a seam. Resting on a game stops its
 * column so it can be read; reduced motion stops all of them.
 *
 * `wall` is the sign-in page's own full-height wall. From 2560 px it takes larger
 * covers (128 px), shorter gaps and the page's own ground, so it does not change colour
 * where the form ends (to try, #133). The window (a phone's band) keeps its size.
 */
export default function AuthCollagePanel({ wall = false }: { wall?: boolean }) {
  // Dealt once mounted, so no two visits look the same. Nothing before that: a
  // first deal for the server's HTML would download every tile twice, and the
  // art would compete with the scripts that make the page work.
  const client = useIsClient()
  const images = useMemo(() => (client ? dealBothPlatforms(shuffle(ART_WALL_RA), shuffle(ART_WALL_STEAM), TILES_SHOWN, COLUMNS) : []), [client])

  return (
    <div className={`relative w-full h-full overflow-hidden [--zig:1.2rem] md:[--zig:2rem] xl:[--zig:3.6rem] ${wall ? WALL.ground : 'bg-bg-card'}`}>
      {/* subtle accent glow behind images */}
      <div className={`absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-bg-secondary/60 ${wall ? WALL.glow : ''}`} />

      {/* blend edges into form bg */}
      <div className="absolute inset-y-0 left-0 w-10 z-20 bg-linear-to-r from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-10 z-20 bg-linear-to-l from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-16 z-20 bg-linear-to-b from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 z-20 bg-linear-to-t from-bg-main to-transparent pointer-events-none" />

      <div className="absolute inset-0 flex items-start gap-2 px-2 sm:gap-4 sm:px-4">
        {intoColumns(images).map((column, c) => {
          // Doubled so translateY(-50%) always lands on an identical frame.
          const tiles = [...column, ...column]
          return (
            <div key={c} className="flex-1 h-full min-w-0">
              <div
                data-column={c}
                className={`marquee-column flex flex-col items-center gap-20 sm:gap-28 xl:gap-36 ${wall ? WALL.gap : ''}`}
                style={{
                  marginTop: COLUMN_OFFSETS[c % COLUMN_OFFSETS.length],
                  willChange: 'transform',
                  animationName: c % 2 === 0 ? 'marquee-up' : 'marquee-down',
                  animationDuration: `${COLUMN_SECONDS[c % COLUMN_SECONDS.length]}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                }}
              >
                {tiles.map((src, i) => (
                  <CoverTile
                    key={i}
                    src={src}
                    hover
                    size={`w-16 h-16 sm:w-20 sm:h-20 xl:w-24 xl:h-24 ${wall ? WALL.tile : ''}`}
                    // Leaning left and right in turn, tilted the way it leans.
                    style={{
                      transform: `translateX(calc(var(--zig) * ${zigzag(c, i)})) rotate(${
                        Math.sign(zigzag(c, i)) * WALL_TILTS[(c + i) % WALL_TILTS.length]
                      }deg)`,
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
