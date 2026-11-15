'use client'

import { IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import RarityBadge from '@/components/ui/RarityBadge'
import DateText from '@/components/ui/DateText'

/**
 * One example achievement, as a game page lists it: its icon (ringed once earned, grey until then), its name and
 * text, Steam's rarity and the day it was earned or "to get". Not a button: it is an example.
 */
export default function LandingSampleAchievement({
  icon,
  name,
  text,
  rarity,
  earnedAt,
}: {
  icon: string
  name: string
  text: string
  rarity: number
  /** "YYYY-MM-DD HH:MM:SS", or null while it is still to get. */
  earnedAt: string | null
}) {
  const { T } = useLanguage()
  const earned = earnedAt !== null

  return (
    <li className="flex items-center gap-3 sm:gap-4 py-3 shadow-hairline-b-soft last:shadow-none">
      <img
        src={icon}
        alt=""
        loading="lazy"
        decoding="async"
        className={`w-12 h-12 shrink-0 rounded-box object-cover ${earned ? 'ring-2 ring-accent' : 'grayscale opacity-50'}`}
      />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className={`text-[0.9375rem] font-semibold ${earned ? '' : 'text-text-secondary'}`}>{name}</span>
        <span className="text-[0.8125rem] text-text-secondary sm:truncate">{text}</span>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <RarityBadge pct={rarity} />
        <span className="sm:w-24 text-right text-[0.8125rem] text-text-secondary whitespace-nowrap">
          {earned ? (
            <DateText value={earnedAt} />
          ) : (
            <span className="inline-flex items-center gap-1">
              <IconLock size={13} aria-hidden="true" />
              {T.userGame.notEarned}
            </span>
          )}
        </span>
      </div>
    </li>
  )
}
