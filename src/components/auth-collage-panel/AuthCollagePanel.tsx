'use client'

import { useEffect, useState } from 'react'
import { steamAssetUrl } from '@/lib/steamClient'

const RA_IMAGES: string[] = [
  'https://media.retroachievements.org/Images/122047.png',
  'https://media.retroachievements.org/Images/097499.png',
  'https://media.retroachievements.org/Images/107150.png',
  'https://media.retroachievements.org/Images/109728.png',
  'https://media.retroachievements.org/Images/104482.png',
  'https://media.retroachievements.org/Images/061105.png',
  'https://media.retroachievements.org/Images/089222.png',
  'https://media.retroachievements.org/Images/109943.png',
  'https://media.retroachievements.org/Images/022051.png',
  'https://media.retroachievements.org/Images/095107.png',
  'https://media.retroachievements.org/Images/113279.png',
  'https://media.retroachievements.org/Images/112421.png',
  'https://media.retroachievements.org/Images/067087.png',
  'https://media.retroachievements.org/Images/106752.png',
  'https://media.retroachievements.org/Images/068336.png',
  'https://media.retroachievements.org/Images/064807.png',
  'https://media.retroachievements.org/Images/116501.png',
  'https://media.retroachievements.org/Images/124258.png',
  'https://media.retroachievements.org/Images/125487.png',
  'https://media.retroachievements.org/Images/112858.png',
  'https://media.retroachievements.org/Images/104260.png',
  'https://media.retroachievements.org/Images/105173.png',
  'https://media.retroachievements.org/Images/068144.png',
  'https://media.retroachievements.org/Images/114756.png',
  'https://media.retroachievements.org/Images/062373.png',
  'https://media.retroachievements.org/Images/103756.png',
  'https://media.retroachievements.org/Images/093950.png',
  'https://media.retroachievements.org/Images/100662.png',
  'https://media.retroachievements.org/Images/058558.png',
  'https://media.retroachievements.org/Images/122562.png',
  'https://media.retroachievements.org/Images/126558.png',
  'https://media.retroachievements.org/Images/071275.png',
  'https://media.retroachievements.org/Images/124487.png',
  'https://media.retroachievements.org/Images/052103.png',
  'https://media.retroachievements.org/Images/060426.png',
  'https://media.retroachievements.org/Images/104787.png',
  'https://media.retroachievements.org/Images/045842.png',
  'https://media.retroachievements.org/Images/089382.png',
]

/**
 * Steam appids, checked one by one against the store before adding — a wrong
 * id here is a broken tile forever. Cover art, cropped square like the RA
 * boxes so the two platforms sit together in the same collage.
 */
const STEAM_APP_IDS = [
  271590, // Grand Theft Auto V
  374320, // Dark Souls III
  2668510, // Red Dead Redemption
  1817070, // Marvel's Spider-Man Remastered
  22380, // Fallout: New Vegas
  489830, // The Elder Scrolls V: Skyrim Special Edition
]

const ALL_IMAGES = [...RA_IMAGES, ...STEAM_APP_IDS.map((id) => steamAssetUrl(id, 'cover'))]

const COLUMNS = 4
/** Seconds per full pass, one per column: slow enough to read, never matching. */
const COLUMN_SECONDS = [82, 104, 74, 94]
/** Head start per column, so tiles never line up as a grid. */
const COLUMN_OFFSETS = ['-9rem', '3rem', '-5rem', '7rem']
/** Fixed tilt per tile, cycling — not random, so the markup is the same everywhere. */
const ROTATIONS = [-8, 6, -4, 10, -7, 5, -11, 8, -3, 9, -6, 7]

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
 * is doubled so the loop never shows a seam. Hovering stops the column under
 * the pointer; reduced motion stops all of them.
 */
export default function AuthCollagePanel() {
  // A fixed order first, so the server and the first paint agree; a different
  // draw once mounted, so no two visits look the same.
  const [images, setImages] = useState(ALL_IMAGES)

  useEffect(() => {
    setImages([...ALL_IMAGES].sort(() => Math.random() - 0.5))
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-bg-card">
      {/* subtle accent glow behind images */}
      <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-bg-secondary/60" />

      {/* blend edges into form bg */}
      <div className="absolute inset-y-0 left-0 w-10 z-20 bg-linear-to-r from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-10 z-20 bg-linear-to-l from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-16 z-20 bg-linear-to-b from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 z-20 bg-linear-to-t from-bg-main to-transparent pointer-events-none" />

      <div className="absolute inset-0 flex items-start gap-4 px-4">
        {intoColumns(images).map((column, c) => {
          // Doubled so translateY(-50%) always lands on an identical frame.
          const tiles = [...column, ...column]
          return (
            <div key={c} className="flex-1 h-full overflow-hidden">
              <div
                data-column={c}
                className="marquee-column flex flex-col items-center gap-28 hover:[animation-play-state:paused]"
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
                  <div
                    key={i}
                    /* A little sideways lean per tile breaks the column into a scatter. */
                    style={{
                      transform: `translateX(${(((i + c) % 4) - 1.5) * 1.8}rem) rotate(${ROTATIONS[(c + i) % ROTATIONS.length]}deg)`,
                    }}
                  >
                    <div className="bg-bg-tertiary p-1.5 rounded-xl shadow-2xl border border-white/10 hover:scale-110 hover:shadow-accent/25 transition-transform duration-200">
                      <img
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className="w-24 h-24 object-cover rounded-lg"
                        loading="lazy"
                        // A dead URL would otherwise sit as a broken-image icon forever.
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
