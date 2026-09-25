'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useReducedMotion } from 'framer-motion'
import AuthCollageTile from './auth-collage-tile/AuthCollageTile'
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

// 6 rows × 4 columns, each row staggered so neighbours overlap instead of
// lining up in a grid.
const POSITIONS = [
  { top: '1%', left: '3%', rotate: -11, z: 3 },
  { top: '4%', left: '26%', rotate: 7, z: 5 },
  { top: '0%', left: '51%', rotate: -5, z: 1 },
  { top: '3%', left: '76%', rotate: 12, z: 4 },
  { top: '14%', left: '14%', rotate: 9, z: 4 },
  { top: '21%', left: '37%', rotate: -13, z: 1 },
  { top: '16%', left: '62%', rotate: 6, z: 3 },
  { top: '22%', left: '84%', rotate: -10, z: 2 },
  { top: '33%', left: '5%', rotate: -7, z: 2 },
  { top: '39%', left: '28%', rotate: 11, z: 4 },
  { top: '35%', left: '53%', rotate: -9, z: 5 },
  { top: '40%', left: '78%', rotate: 5, z: 1 },
  { top: '50%', left: '16%', rotate: 13, z: 5 },
  { top: '56%', left: '40%', rotate: -6, z: 2 },
  { top: '52%', left: '65%', rotate: 10, z: 4 },
  { top: '57%', left: '87%', rotate: -8, z: 3 },
  { top: '68%', left: '8%', rotate: -9, z: 1 },
  { top: '74%', left: '31%', rotate: 8, z: 3 },
  { top: '70%', left: '56%', rotate: -12, z: 2 },
  { top: '75%', left: '80%', rotate: 6, z: 5 },
  { top: '87%', left: '20%', rotate: -8, z: 3 },
  { top: '91%', left: '44%', rotate: 6, z: 2 },
  { top: '88%', left: '68%', rotate: -11, z: 4 },
  { top: '92%', left: '89%', rotate: 9, z: 1 },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.55, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

/** How often a tile turns over to show a different game, and how long that takes. */
const FLIP_EVERY_MS = 3200
const FLIP_MS = 700

/**
 * The art wall beside the sign-in and register forms: game boxes from both
 * platforms, scattered and overlapping.
 *
 * Every visit deals a different hand from the pool. The tiles lean towards the
 * pointer by depth, breathe on their own slow loops, and every few seconds one
 * turns over and comes back as another game — the wall keeps re-dealing itself
 * while you type. All of it stops under reduced motion.
 */
export default function AuthCollagePanel() {
  const reduce = useReducedMotion()
  const still = Boolean(reduce)

  // A fixed slice first, so the server and the first paint agree; a different
  // draw once mounted, so no two visits look the same.
  const [images, setImages] = useState(() => ALL_IMAGES.slice(0, POSITIONS.length))
  const [flipping, setFlipping] = useState<number | null>(null)

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)

  useEffect(() => {
    setImages([...ALL_IMAGES].sort(() => Math.random() - 0.5).slice(0, POSITIONS.length))
  }, [])

  useEffect(() => {
    if (still) return
    const timers: ReturnType<typeof setTimeout>[] = []

    const interval = setInterval(() => {
      const i = Math.floor(Math.random() * POSITIONS.length)
      setFlipping(i)
      // Swap while the tile is edge-on, so the change is never seen happening.
      timers.push(
        setTimeout(() => {
          setImages((prev) => {
            const spare = ALL_IMAGES.filter((src) => !prev.includes(src))
            if (!spare.length) return prev
            const next = [...prev]
            next[i] = spare[Math.floor(Math.random() * spare.length)]
            return next
          })
        }, FLIP_MS / 2),
      )
      timers.push(setTimeout(() => setFlipping(null), FLIP_MS))
    }, FLIP_EVERY_MS)

    return () => {
      clearInterval(interval)
      timers.forEach(clearTimeout)
    }
  }, [still])

  function handlePointer(e: React.MouseEvent<HTMLDivElement>) {
    if (still) return
    const box = e.currentTarget.getBoundingClientRect()
    pointerX.set(((e.clientX - box.left) / box.width) * 2 - 1)
    pointerY.set(((e.clientY - box.top) / box.height) * 2 - 1)
  }

  function resetPointer() {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-bg-card"
      onMouseMove={handlePointer}
      onMouseLeave={resetPointer}
    >
      {/* subtle accent glow behind images */}
      <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-bg-secondary/60" />

      {/* blend edges into form bg */}
      <div className="absolute inset-y-0 left-0 w-10 z-20 bg-linear-to-r from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-10 z-20 bg-linear-to-l from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-12 z-20 bg-linear-to-b from-bg-main to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-12 z-20 bg-linear-to-t from-bg-main to-transparent pointer-events-none" />

      <motion.div
        className="relative w-full h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {POSITIONS.map((pos, i) => (
          <motion.div key={i} variants={itemVariants}>
            <AuthCollageTile
              src={images[i]}
              position={pos}
              index={i}
              flipping={flipping === i}
              still={still}
              pointerX={pointerX}
              pointerY={pointerY}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
