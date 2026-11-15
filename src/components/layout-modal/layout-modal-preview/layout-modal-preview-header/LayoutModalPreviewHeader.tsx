'use client'

import { useLanguage } from '@/context/LanguageContext'
import StreakTag from '@/components/ui/StreakTag'

/** The site's top bar, drawn small: fixed words, nothing in it can be used. */
export default function LayoutModalPreviewHeader() {
  const { T, lang } = useLanguage()
  return (
    <div className="flex h-12 shrink-0 items-center gap-3.5 border-b border-ink/[0.08] bg-bg-header px-3.5">
      <span className="font-display italic font-extrabold text-xl leading-none text-accent pr-1">CV</span>
      {[T.groups.title, T.following.title, T.rankings.title].map((label) => (
        <span key={label} className="hidden truncate text-[0.8125rem] font-semibold text-text-secondary @2xl:block">{label}</span>
      ))}
      <span className="ml-auto hidden h-8 w-52 items-center truncate rounded-field bg-bg-card px-3.5 text-xs text-text-secondary @lg:flex">{T.search.placeholder}</span>
      <StreakTag days={12} text={T.rankings.daysShort.replace('{n}', (12).toLocaleString(lang))} glow={false} className="ml-auto @lg:ml-0" />
      <span aria-hidden="true" className="h-8 w-8 shrink-0 rounded-full bg-accent/20 ring-1 ring-inset ring-ink/10" />
    </div>
  )
}
