'use client'

import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'
import AuthCollagePanel from '@/components/auth-collage-panel/AuthCollagePanel'
import { useLanguage } from '@/context/LanguageContext'
import { buttonClass } from '@/components/ui/Button'

const PRIMARY = buttonClass('primary', 'lg')

/**
 * The opening: what the app is and the one way to start, on the left; the
 * real art wall from the sign-in page in a window on the right, so the page
 * shows the games it is about. On a phone the window drops under the text.
 */
export default function LandingHero() {
  const { T } = useLanguage()

  return (
    <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-10 pb-16 lg:pt-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-12 items-center">
      <div className="flex flex-col items-start gap-6 enter-rows">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[1.05] text-balance">
          {T.landing.tagline}
        </h1>
        <p className="text-base sm:text-lg text-text-secondary max-w-[52ch] leading-relaxed">
          {T.landing.intro}
        </p>
        <div>
          <Link href="/authPage?mode=register" className={PRIMARY}>
            {T.landing.createAccount}
            <IconArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="enter-card [--i:3] relative h-72 sm:h-96 lg:h-[540px] rounded-[2rem] overflow-hidden ring-1 ring-ink/10 bg-bg-card shadow-2xl shadow-black/40 pointer-events-none select-none"
      >
        <AuthCollagePanel />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(var(--bg-main)/0.85))]" />
      </div>
    </section>
  )
}
