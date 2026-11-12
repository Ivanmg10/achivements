'use client'

import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'
import CoverBand from '@/components/cover-band/CoverBand'
import { useLanguage } from '@/context/LanguageContext'
import { buttonClass } from '@/components/ui/Button'
import { REGISTER_HREF } from '@/utils/authLinks'

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
          <Link href={REGISTER_HREF} className={PRIMARY}>
            {T.landing.createAccount}
            <IconArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <CoverBand className="enter-card [--i:3] h-72 sm:h-96 lg:h-[540px] rounded-[2rem] shadow-2xl shadow-black/40" />
    </section>
  )
}
