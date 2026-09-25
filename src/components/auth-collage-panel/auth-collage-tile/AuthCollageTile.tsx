'use client'

import { motion, useSpring, useTransform, type MotionValue } from 'framer-motion'

export type TilePosition = { top: string; left: string; rotate: number; z: number }

/** How far a tile follows the pointer, in px: the nearer the layer, the more. */
const PARALLAX = 14

/**
 * One game box on the sign-in wall. It drifts on its own slow loop, leans
 * towards the pointer by its depth (so the wall has layers), and flips over
 * to a different game when the panel picks it.
 *
 * `pointerX`/`pointerY` come from the panel as -1…1, so every tile reads the
 * same pointer without each one listening for mouse moves.
 */
export default function AuthCollageTile({
  src,
  position,
  index,
  flipping,
  still,
  pointerX,
  pointerY,
}: {
  src: string
  position: TilePosition
  index: number
  flipping: boolean
  /** Reduced motion: no drift, no parallax, no flip. */
  still: boolean
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
}) {
  // Depth 1 (back) … 5 (front): nearer layers travel further, as in a diorama.
  const depth = (position.z / 5) * PARALLAX
  const x = useSpring(useTransform(pointerX, (v) => (still ? 0 : v * depth)), { stiffness: 60, damping: 20 })
  const y = useSpring(useTransform(pointerY, (v) => (still ? 0 : v * depth)), { stiffness: 60, damping: 20 })

  // Drift path, derived from the index so the server and browser agree and no
  // two neighbours move in step.
  const dx = ((index % 5) - 2) * 3
  const dy = ((index % 3) - 1) * 5
  const dr = ((index % 4) - 1.5) * 0.9

  return (
    <motion.div
      className="absolute"
      style={{ top: position.top, left: position.left, zIndex: position.z, x, y, perspective: 900 }}
    >
      <motion.div
        animate={
          still
            ? undefined
            : { x: [0, dx, 0, -dx, 0], y: [0, dy, -dy, dy / 2, 0], rotate: [0, dr, -dr, dr / 2, 0] }
        }
        transition={{
          duration: 14 + (index % 7) * 2,
          delay: (index % 9) * 0.7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          data-flipping={flipping || undefined}
          animate={flipping && !still ? { rotateY: [0, 90, 0], scale: [1, 1.12, 1] } : { rotateY: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div style={{ transform: `rotate(${position.rotate}deg)` }}>
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
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
