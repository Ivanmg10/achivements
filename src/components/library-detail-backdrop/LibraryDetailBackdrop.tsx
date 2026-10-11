'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import LibraryShelfBanner from '@/components/library-shelf-banner/LibraryShelfBanner'
import type { LibraryEntry } from '@/utils/libraryInsights'

/**
 * The art of the game, blurred, behind the top of its own card, the way a game's
 * page has its title screen behind it (with as little blur as that page uses,
 * so the picture can still be told). It fades into the card's colour toward the
 * bottom, so the card is the same all the way down however tall it is made.
 *
 * It fills the card it is in, which has to be a box of its own (`relative
 * isolate overflow-hidden`): a negative layer is then above the card's background and
 * below what is written on it. It answers no clicks. Decorative.
 */
export default function LibraryDetailBackdrop({ entry }: { entry: LibraryEntry }) {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] max-h-full">
      <AnimatePresence>
        <motion.div
          key={entry.key}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 scale-110 blur-lg"
        >
          <LibraryShelfBanner entry={entry} />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg-card/35 to-bg-card" />
    </div>
  )
}
