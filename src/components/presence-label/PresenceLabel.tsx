'use client'

import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { presenceOf } from '@/utils/friends'
import { relativeTime } from '@/utils/utils'

/**
 * Whether someone is around, in words: "Online" (green), "Seen 3 h ago", or
 * "Seen over a month ago". With nothing to say (never seen, or they do not
 * share it) it shows `fallback`, usually their bio.
 */
export default function PresenceLabel({
  online,
  lastSeenAt,
  fallback = null,
  className = 'text-xs',
}: {
  online?: boolean
  lastSeenAt?: string | null
  fallback?: ReactNode
  className?: string
}) {
  const { T, lang } = useLanguage()
  const presence = presenceOf({ online, lastSeenAt })
  if (!presence) return <>{fallback}</>
  if (presence.kind === 'online') return <span className={`${className} font-semibold text-success`}>{T.following.online}</span>
  return (
    <span className={`${className} text-text-secondary truncate`}>
      {presence.kind === 'seen' ? T.following.seen.replace('{when}', relativeTime(presence.at, lang)) : T.following.seenLongAgo}
    </span>
  )
}
