import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { IconArrowsDiagonal } from '@tabler/icons-react'
import styles from '@/components/welcome-page/WelcomePage.module.css'

/**
 * One of the intro's numbered points, as a card: its number and title only, so the
 * list stays short (its line is in the opened point). The whole card is the
 * button; pressing it grows the card (`layoutId`) into the
 * point opened over the whole step (`WelcomePageIntroDetail`). Coming back,
 * the focus returns to it.
 */
export default function WelcomePageIntroPerk({
  number,
  title,
  layoutId,
  onOpen,
  delayMs,
  focusOnMount = false,
}: {
  number: number
  title: string
  layoutId?: string
  onOpen: () => void
  delayMs: number
  focusOnMount?: boolean
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (focusOnMount) buttonRef.current?.focus()
  }, [focusOnMount])

  return (
    <motion.li
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      className={`${styles.card} rounded-card bg-bg-card ring-1 ring-ink/[0.06]`}
      style={{ animationDelay: `calc(var(--enter-delay, 0s) + ${delayMs}ms)` }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onOpen}
        className="group w-full flex items-center gap-3 p-2.5 pr-3.5 text-left rounded-card hover:bg-ink/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-tile bg-accent/15 text-accent flex items-center justify-center font-display italic font-extrabold text-lg">
          {number}
        </span>
        <span className="flex-1 min-w-0 font-bold text-[0.9375rem]">{title}</span>
        <IconArrowsDiagonal
          size={16}
          aria-hidden="true"
          className="shrink-0 text-text-secondary group-hover:text-accent group-hover:scale-110 transition"
        />
      </button>
    </motion.li>
  )
}
