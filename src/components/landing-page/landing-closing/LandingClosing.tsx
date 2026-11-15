'use client'

import { useLanguage } from '@/context/LanguageContext'
import { REGISTER_HREF } from '@/utils/authLinks'
import { ART_WALL_RA, ART_WALL_STEAM, dealBothPlatforms } from '@/utils/artWall'
import CoverReel from '@/components/cover-reel/CoverReel'
import Button from '@/components/ui/Button'

// Two rows of eight, both platforms in turn, none of them on the title screen.
const COVERS = dealBothPlatforms(ART_WALL_RA.slice(40), ART_WALL_STEAM, 16, 1)

/**
 * The end of the page, with no card: the art wall's covers going by in two rows, opposite ways, tinted
 * in the accent under scan lines, fading into the page above and below (no edge), and over them the last line and the two ways in.
 */
export default function LandingClosing() {
  const { T } = useLanguage()

  return (
    <section aria-labelledby="landing-closing-title" className="relative isolate overflow-hidden min-h-[22rem] sm:min-h-[26.25rem] flex items-center justify-center px-4 py-16">
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none select-none [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]">
        <div className="absolute inset-0 flex flex-col justify-center gap-5 sm:gap-6 opacity-50">
          <CoverReel covers={COVERS.slice(0, 8)} />
          <CoverReel covers={COVERS.slice(8)} back />
        </div>
        <div className="absolute inset-0 bg-accent mix-blend-color opacity-40" />
        <div className="scanlines absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(var(--bg-main)/0.85),rgb(var(--bg-main)/0.55)_45%,rgb(var(--bg-main)/0.2))]" />
      </div>
      <div className="flex flex-col items-center text-center gap-4 sm:gap-5">
        <h2 id="landing-closing-title" className="font-display italic font-extrabold text-[3.375rem] sm:text-[6rem] leading-[0.9] text-balance">
          {T.landing.closingTitle}
        </h2>
        <p className="text-[0.9375rem] sm:text-[1.1875rem] text-text-main/90">{T.landing.closingText}</p>
        <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-3.5 mt-2">
          <Button href={REGISTER_HREF} size="lg">{T.landing.createAccount}</Button>
          <Button href="/authPage" variant="secondary" size="lg">{T.landing.signIn}</Button>
        </div>
      </div>
    </section>
  )
}
