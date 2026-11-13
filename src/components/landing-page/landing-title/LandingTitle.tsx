'use client'

import Link from 'next/link'
import { IconArrowDown, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { REGISTER_HREF } from '@/utils/authLinks'
import { PLATFORM_NAME } from '@/utils/gameRef'
import LandingBackdrop from '@/components/landing-page/landing-backdrop/LandingBackdrop'
import LandingLanguage from '@/components/landing-page/landing-language/LandingLanguage'
import BrandMark from '@/components/ui/BrandMark'
import Button from '@/components/ui/Button'
import Facts from '@/components/ui/Facts'
import ToggleButton from '@/components/ui/ToggleButton'

const LINK = 'relative tap-target rounded focus-ring text-text-main/80 hover:text-text-main transition-colors'

/**
 * The landing's first screen, a game's title screen (Metal Gear Solid 2's was the reference; canvas page 4,
 * "LandH1b" with "Fondo"): the platforms, the name in big with the logo after it and the line under it on
 * top; the drifting art behind; what the site does and the two ways in at the bottom. The title is the
 * page's `h1` and the largest thing on it, text in the server's HTML, so it is what paints first.
 * `still` and `onStill` are the stop button for the page's motion, small beside the legal line: art that moves by
 * itself for more than five seconds needs a way to stop it (WCAG 2.2.2), so it stays, out of the way.
 * The language is the top bar's first thing, for a visitor whose browser guessed wrong.
 */
export default function LandingTitle({ still, onStill }: { still: boolean; onStill: () => void }) {
  const { T } = useLanguage()

  return (
    <section className="relative isolate min-h-[100svh] flex flex-col px-4 sm:px-8 lg:px-14 overflow-hidden">
      <LandingBackdrop />

      <div className="flex items-center justify-between gap-4 pt-4 sm:pt-6 short:pt-3">
        <LandingLanguage />
        <nav aria-label={T.publicPages.more} className="flex items-center gap-4 sm:gap-7 text-sm sm:text-[0.9375rem] uhd:text-lg font-semibold">
          <Link href="/rankings" className={LINK}>{T.rankings.title}</Link>
          <Link href="/rankings/how" className={`${LINK} max-sm:hidden`}>{T.landing.howPoints}</Link>
          <a href="#faq" className={LINK}>{T.publicPages.faqTitle}</a>
        </nav>
      </div>

      <div className="flex flex-col items-center text-center pt-14 sm:pt-[clamp(1.5rem,7svh,5rem)] short:pt-3 enter-rows">
        <p className="text-xs sm:text-sm uhd:text-lg font-bold tracking-[0.2em] text-text-main/75">
          <Facts items={[PLATFORM_NAME.ra, PLATFORM_NAME.steam, PLATFORM_NAME.psn]} />
        </p>
        <h1 className="mt-3 sm:mt-2.5">
          <BrandMark name={T.authPage.brand} size="title" logoAfter />
        </h1>
        <p className="mt-4 sm:mt-[0.4em] text-[0.8125rem] sm:text-[clamp(1.125rem,2.1vw,1.875rem)] font-semibold tracking-[0.18em] text-text-main/90 text-balance">
          {T.landing.tagline}
        </p>
      </div>

      <div className="flex-1 min-h-10" />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 sm:gap-12 enter-rise [--i:3]">
        <p className="max-w-[35rem] uhd:max-w-[44rem] text-[0.9375rem] sm:text-lg short:text-[0.9375rem] uhd:text-[1.375rem] leading-relaxed text-text-main/85">{T.landing.intro}</p>
        <div className="flex flex-col gap-2.5 sm:items-end shrink-0">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-3.5">
            <Button href={REGISTER_HREF} size="xl">{T.landing.createAccount}</Button>
            <Button href="/authPage" variant="secondary" size="xl">{T.landing.signIn}</Button>
          </div>
          <p className="max-sm:text-center text-sm uhd:text-lg font-semibold text-text-main/85 short:hidden">{T.landing.free}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-7 pb-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-6 sm:pt-8 sm:pb-5 short:pt-3 short:pb-2 short:gap-2">
        <div className="order-last sm:order-none sm:col-start-1 sm:row-start-1 flex items-center gap-2">
          {/* Nothing moves under reduced motion, so there is nothing to stop. */}
          <ToggleButton pressed={still} onToggle={onStill} label={T.landing.stopMotion} icon={IconPlayerPause} pressedIcon={IconPlayerPlay} size={16} className="p-1.5 motion-reduce:hidden" />
          <span className="short:hidden text-xs sm:text-[0.8125rem] uhd:text-base text-text-secondary">{T.landing.footer}</span>
        </div>
        {/* The way into the rest of the page, in the middle, its arrow bobbing (still under reduced motion or the stop button).
            Held sideways the legal line gives it its room: the footer says it again. */}
        <a href="#que-es" className={`${LINK} sm:col-start-2 sm:row-start-1 inline-flex items-center gap-2 text-[0.9375rem] sm:text-base uhd:text-xl font-bold`}>
          {T.landing.whatIs}
          <IconArrowDown size={22} aria-hidden="true" className="hint-bounce text-accent" />
        </a>
      </div>
    </section>
  )
}
