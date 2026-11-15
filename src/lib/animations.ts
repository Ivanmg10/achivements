import type { Variants } from 'framer-motion'

export const formTransition: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
}
