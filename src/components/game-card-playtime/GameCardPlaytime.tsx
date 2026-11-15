'use client'

import { IconClock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { formatPlaytime } from '@/utils/steamFeed'

/** "Play time · 12 h" with its clock, the line Steam, PSN and Xbox cards share. */
export default function GameCardPlaytime({ minutes }: { minutes: number }) {
  const { T, lang } = useLanguage()
  return (
    <span className="flex items-center gap-1 text-xs text-text-secondary mt-1">
      <IconClock size={12} aria-hidden="true" />
      {T.steam.playtime} · {formatPlaytime(minutes, T.steam, lang)}
    </span>
  )
}
