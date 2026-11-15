'use client'

import { IconClock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { formatPlaytime } from '@/utils/steamFeed'

/** A feed row's play time: a clock and the hours, named "Play time" for a screen reader. */
export default function FeedGameCardPlaytime({ minutes }: { minutes: number }) {
  const { T, lang } = useLanguage()
  return (
    <span className="flex items-center gap-1">
      <IconClock size={12} aria-hidden="true" />
      <span className="sr-only">{T.steam.playtime}: </span>
      {formatPlaytime(minutes, T.steam, lang)}
    </span>
  )
}
