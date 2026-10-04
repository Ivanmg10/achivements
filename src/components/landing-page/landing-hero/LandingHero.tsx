'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { IconArrowRight } from '@tabler/icons-react'
import AuthCollagePanel from '@/components/auth-collage-panel/AuthCollagePanel'
import { useLanguage } from '@/context/LanguageContext'

const PRIMARY =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-bg-main font-semibold hover:bg-accent-hover active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * The opening: what the app is and the one way to start, on the left; the
 * real art wall from the sign-in page in a window on the right, so the page
 * shows the games it is about. On a phone the window drops under the text.
 */
export default function LandingHero() {
  const { T } = useLanguage()
  const reduce = useReducedMotion()
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: EASE } }

  return (
    <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-10 pb-16 lg:pt-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-12 items-center">
      <div className="flex flex-col items-start gap-6">
        <motion.h1
          {...rise(0)}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[1.05] text-balance"
        >
          {T.landing.tagline}
        </motion.h1>
        <motion.p {...rise(0.08)} className="text-base sm:text-lg text-text-secondary max-w-[52ch] leading-relaxed">
          {T.landing.intro}
        </motion.p>
        <motion.div {...rise(0.16)}>
          <Link href="/authPage?mode=register" className={PRIMARY}>
            {T.landing.createAccount}
            <IconArrowRight size={18} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>

      <motion.div
        aria-hidden="true"
        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
        className="relative h-72 sm:h-96 lg:h-[540px] rounded-[2rem] overflow-hidden ring-1 ring-ink/10 bg-bg-card shadow-2xl shadow-black/40 pointer-events-none select-none"
      >
        <AuthCollagePanel />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(var(--bg-main)/0.85))]" />
      </motion.div>
    </section>
  )
}
