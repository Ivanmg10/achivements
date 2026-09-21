'use client'

import { IconWorld } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * "Online?" next to a Steam achievement that probably needs online play. The
 * question mark and the hint say it is a guess: Steam has no such flag.
 */
export default function SteamOnlineBadge({ className = '' }: { className?: string }) {
  const { T } = useLanguage()
  return (
    <span
      title={T.steam.likelyOnlineHint}
      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 whitespace-nowrap ${className}`}
    >
      <IconWorld size={11} aria-hidden="true" />
      {T.steam.likelyOnline}
      <span className="sr-only">: {T.steam.likelyOnlineHint}</span>
    </span>
  )
}
