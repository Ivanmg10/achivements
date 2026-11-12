'use client'

import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { buttonClass } from '@/components/ui/Button'
import { REGISTER_HREF } from '@/utils/authLinks'

const PRIMARY = buttonClass('primary', 'lg')

/**
 * How a comparison or how-to page ends: a rule, one line (it is free) and the way
 * to create an account. No card and no glow: the page has made its case, and the
 * landing keeps the big closing for itself.
 */
export default function SeoPageClosing() {
  const { T } = useLanguage()

  return (
    <div className="border-t border-ink/10 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
      <p className="text-sm sm:text-base text-text-secondary">
        <span className="font-semibold text-text-main">{T.landing.closingTitle}</span>
        <span className="block">{T.landing.closingText}</span>
      </p>
      <Link href={REGISTER_HREF} className={`${PRIMARY} self-start sm:self-auto`}>
        {T.landing.createAccount}
        <IconArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  )
}
