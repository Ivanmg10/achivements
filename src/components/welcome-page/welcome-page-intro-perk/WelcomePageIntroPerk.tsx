import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { IconArrowsDiagonal } from '@tabler/icons-react'
import styles from '@/components/welcome-page/WelcomePage.module.css'

/**
 * One of the intro's numbered points, as a card: its title and one line. The
 * whole card is the button; pressing it grows the card (`layoutId`) into the
 * point opened over the whole step (`WelcomePageIntroDetail`). Coming back,
 * the focus returns to it.
 */
export default function WelcomePageIntroPerk({
  number,
  title,
  text,
  layoutId,
  onOpen,
  delayMs,
  focusOnMount = false,
}: {
  number: number
  title: string
  text: string
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
      className={`${styles.card} rounded-2xl bg-bg-card ring-1 ring-ink/[0.06]`}
      style={{ animationDelay: `calc(var(--enter-delay, 0s) + ${delayMs}ms)` }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onOpen}
        className="group w-full flex items-center gap-3.5 p-3.5 text-left rounded-2xl hover:bg-ink/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-display italic font-extrabold text-lg">
          {number}
        </span>
        <span className="flex-1 flex flex-col gap-0.5 min-w-0">
          <span className="font-bold text-[0.9375rem]">{title}</span>
          <span className="text-[0.8125rem] text-text-secondary">{text}</span>
        </span>
        <IconArrowsDiagonal
          size={16}
          aria-hidden="true"
          className="shrink-0 text-text-secondary group-hover:text-accent group-hover:scale-110 transition"
        />
      </button>
    </motion.li>
  )
}
