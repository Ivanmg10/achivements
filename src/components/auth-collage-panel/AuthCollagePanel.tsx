'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { steamAssetUrl } from '@/lib/steamClient'

const RA_IMAGES = [
  'https://media.retroachievements.org/Images/122047.png',
  'https://media.retroachievements.org/Images/097499.png',
  'https://media.retroachievements.org/Images/107150.png',
  'https://media.retroachievements.org/Images/084102.png',
  'https://media.retroachievements.org/Images/069307.png',
  'https://media.retroachievements.org/Images/111905.png',
  'https://media.retroachievements.org/Images/060409.png',
  'https://media.retroachievements.org/Images/052570.png',
  'https://media.retroachievements.org/Images/063596.png',
  'https://media.retroachievements.org/Images/086406.png',
  'https://media.retroachievements.org/Images/065049.png',
  'https://media.retroachievements.org/Images/077137.png',
  'https://media.retroachievements.org/Images/065707.png',
  'https://media.retroachievements.org/Images/078392.png',
  'https://media.retroachievements.org/Images/074003.png',
  'https://media.retroachievements.org/Images/054157.png',
  'https://media.retroachievements.org/Images/098860.png',
  'https://media.retroachievements.org/Images/063805.png',
  'https://media.retroachievements.org/Images/084414.png',
  'https://media.retroachievements.org/Images/069905.png',
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

/** RA first, Steam threaded in every fourth slot: both platforms, no clumping. */
const TILE_IMAGES = (() => {
  const steam = STEAM_APP_IDS.map((id) => steamAssetUrl(id, 'cover'))
  const out: string[] = []
  let s = 0
  for (let i = 0; i < RA_IMAGES.length; i++) {
    if (i > 0 && i % 4 === 0 && s < steam.length) out.push(steam[s++])
    out.push(RA_IMAGES[i])
  }
  return out
})()

// 6 rows × 4 columns, each row staggered so neighbours overlap instead of
// lining up in a grid.
const POSITIONS: { top: string; left: string; rotate: number; z: number }[] = [
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

/**
 * Each tile drifts on its own slow loop. Everything is derived from the
 * tile's index rather than random, so the server and the browser draw the
 * same thing, and no two neighbours ever move in step.
 */
function drift(i: number) {
  const dx = ((i % 5) - 2) * 3 // -6…6 px
  const dy = ((i % 3) - 1) * 5 // -5…5 px
  const dr = ((i % 4) - 1.5) * 0.9 // ±1.35 deg
  return {
    x: [0, dx, 0, -dx, 0],
    y: [0, dy, -dy, dy / 2, 0],
    rotate: [0, dr, -dr, dr / 2, 0],
    duration: 14 + (i % 7) * 2, // 14…26 s
    delay: (i % 9) * 0.7,
  }
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.55, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

/**
 * The art wall beside the sign-in form: game boxes from both platforms,
 * scattered and overlapping. They fade in on load, then breathe — a few
 * pixels each, slowly and out of step — so the panel feels alive without
 * pulling the eye off the form. Still under reduced motion.
 */
export default function AuthCollagePanel() {
  const reduce = useReducedMotion()

  return (
    <div className="relative w-full h-full overflow-hidden bg-bg-card">
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
        {POSITIONS.map((pos, i) => {
          const { duration, delay, ...path } = drift(i)
          return (
            <motion.div
              key={i}
              variants={itemVariants}
              className="absolute"
              style={{ top: pos.top, left: pos.left, zIndex: pos.z }}
            >
              <motion.div
                animate={reduce ? undefined : path}
                transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div style={{ transform: `rotate(${pos.rotate}deg)` }}>
                  <div className="bg-bg-tertiary p-1.5 rounded-xl shadow-2xl border border-white/10 hover:scale-110 hover:shadow-accent/25 transition-transform duration-200">
                    <img
                      src={TILE_IMAGES[i % TILE_IMAGES.length]}
                      alt=""
                      aria-hidden="true"
                      className="w-24 h-24 object-cover rounded-lg"
                      loading="lazy"
                      // A wrong id would otherwise sit as a broken-image icon forever.
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
