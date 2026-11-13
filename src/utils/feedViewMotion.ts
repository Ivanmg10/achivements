// A list of game rows and one of them opened are two views. One leaves before the other comes in, so an opened card
// never grows over rows still fading out (the home's recent feed, the landing's library example).
export const FEED_VIEW_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

/** The swap's timing; none under reduced motion. */
export const feedViewTransition = (reduce: boolean | null) => ({ duration: reduce ? 0 : 0.18, ease: [0.4, 0, 0.2, 1] as const })
