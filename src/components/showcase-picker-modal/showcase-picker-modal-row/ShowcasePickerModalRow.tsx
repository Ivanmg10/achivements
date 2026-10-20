'use client'

import Image from 'next/image'
import { IconCheck, IconPlus, IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { ShowcaseEntry } from '@/utils/showcase'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'

/** One earned achievement in the picker: a button that adds it, or says it is already in. */
export default function ShowcasePickerModalRow({
  entry,
  inShowcase,
  disabled,
  onPick,
}: {
  entry: ShowcaseEntry
  inShowcase: boolean
  /** The showcase is full: nothing more can go in. */
  disabled: boolean
  onPick: () => void
}) {
  const { T, lang } = useLanguage()
  const date = new Date(entry.earnedAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' })

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={inShowcase || disabled}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-bg-card disabled:hover:bg-transparent disabled:cursor-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      {entry.badge ? (
        <Image src={entry.badge} alt="" width={40} height={40} className="w-10 h-10 rounded-lg object-cover shrink-0" unoptimized />
      ) : (
        <span aria-hidden="true" className="w-10 h-10 rounded-lg bg-ink/10 flex items-center justify-center text-text-secondary shrink-0">
          <IconTrophy size={18} />
        </span>
      )}
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate">{entry.title}</span>
        <span className="flex items-center gap-1.5 text-xs text-text-secondary min-w-0">
          <PlatformLogo source={entry.source} size={10} label={PLATFORM_NAME[entry.source]} />
          <span className="truncate">{entry.gameTitle}</span>
          <span className="shrink-0 tabular-nums">· {date}</span>
        </span>
      </span>
      {inShowcase ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-accent shrink-0">
          <IconCheck size={14} aria-hidden="true" />
          {T.showcase.inShowcase}
        </span>
      ) : (
        <IconPlus size={18} className={`shrink-0 ${disabled ? 'text-text-secondary/40' : 'text-accent'}`} aria-hidden="true" />
      )}
    </button>
  )
}
