'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useScrolledPast } from '@/hooks/useScrolledPast'
import LandingLanguage from '@/components/landing-page/landing-language/LandingLanguage'
import Button from '@/components/ui/Button'
import { REGISTER_HREF } from '@/utils/authLinks'

// The app bar's own link (MainHeader's NavLink), so the two bars read the same.
const LINK =
  'relative tap-target inline-flex items-center h-10 px-3 text-[0.9375rem] font-semibold whitespace-nowrap text-text-secondary hover:text-text-main transition-colors focus-ring focus-visible:rounded-chip'

/**
 * The landing's top bar (the owner, 2026-11-13): the language, the links and the two ways in, at the app bar's
 * sizes. It stays at the top while the page scrolls: clear over the title screen, then on the app bar's frosted
 * ground once the page moves. Its wrapper is 0 px tall, so it lies over the title screen instead of pushing it;
 * held sideways (`short:`) it scrolls away, as the app bar does. Below `md` only the ways in stay beside the
 * language; the links are in the footer and further down the page.
 */
export default function LandingTopBar() {
  const { T } = useLanguage()
  const scrolled = useScrolledPast(8)

  return (
    <div className="sticky short:relative top-0 z-40 h-0">
      <div
        className={`h-16 short:h-14 px-4 sm:px-8 lg:px-14 flex items-center gap-2 transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none ${
          scrolled ? 'bg-bg-header/85 backdrop-blur-xl backdrop-saturate-150 shadow-hairline-b' : ''
        }`}
      >
        <LandingLanguage />
        <nav aria-label={T.publicPages.more} className="max-md:hidden ml-auto flex items-center">
          <Link href="/rankings" className={LINK}>{T.rankings.title}</Link>
          <Link href="/rankings/how" className={`${LINK} max-lg:hidden`}>{T.landing.howPoints}</Link>
          <a href="#faq" className={LINK}>{T.publicPages.faqTitle}</a>
        </nav>
        <div className="max-md:ml-auto md:ml-3 flex items-center gap-2">
          <Button href="/authPage" variant="secondary" size="sm">{T.landing.signIn}</Button>
          <Button href={REGISTER_HREF} size="sm">{T.landing.createAccount}</Button>
        </div>
      </div>
    </div>
  )
}
