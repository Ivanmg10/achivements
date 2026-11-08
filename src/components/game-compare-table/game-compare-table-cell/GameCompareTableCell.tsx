'use client'

import { IconCheck, IconLock } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { formatUnlockDate, type Unlock } from '@/utils/gameCompare'
import { Skeleton } from '@/components/ui/Skeleton'
import Kicker from '@/components/ui/Kicker'

/**
 * Whether one person has an achievement, and when: a tick and the day, or a
 * lock. Hardcore and "first" are words on small tags, never colour alone.
 */
export default function GameCompareTableCell({
  who,
  unlock,
  first = false,
  loading = false,
}: {
  who: string
  unlock: Unlock | null
  first?: boolean
  loading?: boolean
}) {
  const { T, lang } = useLanguage()
  const earned = unlock?.earned === true
  const date = formatUnlockDate(unlock?.earnedAt ?? null, lang)

  return (
    <div className={`rounded-box px-2.5 py-1.5 ring-1 flex flex-col gap-0.5 min-w-0 ${earned ? 'bg-success/10 ring-success/20' : 'bg-ink/[0.04] ring-ink/5'}`}>
      <Kicker as="span" className="truncate">{who}</Kicker>
      {loading ? (
        <Skeleton className="h-4 w-20" />
      ) : (
        <span className={`flex items-center gap-1 text-xs font-medium ${earned ? 'text-text-main' : 'text-text-secondary'}`}>
          {earned ? <IconCheck size={13} className="text-success shrink-0" aria-hidden="true" /> : <IconLock size={12} className="shrink-0" aria-hidden="true" />}
          <span className="truncate">{earned ? date ?? T.userGame.earnedNoDate : T.userGame.notEarned}</span>
        </span>
      )}
      {(unlock?.hardcore || first) && earned && (
        <span className="flex flex-wrap gap-1">
          {unlock?.hardcore && <Kicker as="span" tone="warning">{T.userGame.hardcore}</Kicker>}
          {first && <Kicker as="span" tone="accent">{T.userGame.first}</Kicker>}
        </span>
      )}
    </div>
  )
}
