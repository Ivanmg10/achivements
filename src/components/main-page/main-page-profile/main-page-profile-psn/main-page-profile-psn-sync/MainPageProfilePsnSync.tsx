'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import Facts from '@/components/ui/Facts'
import { relativeTime } from '@/utils/dates'

/**
 * When the PSN library was last read from Sony, and when the refresh button reads it again (#177: once per
 * 10 minutes). The second fact goes once that moment has passed: the refresh button reads it now.
 */
export default function MainPageProfilePsnSync({ syncedAt, nextSyncAt }: { syncedAt?: number | null; nextSyncAt?: number | null }) {
  const { T, lang } = useLanguage()
  // The moment it was drawn: the line is read at a glance, it does not tick.
  const [now] = useState(() => Date.now())
  if (!syncedAt) return null
  const iso = (ms: number) => new Date(ms).toISOString()
  return (
    <p className="text-[0.8125rem] text-text-secondary">
      <Facts
        items={[
          T.psn.syncedAgo.replace('{when}', relativeTime(iso(syncedAt), lang, 'long')),
          nextSyncAt && nextSyncAt > now && T.psn.nextSync.replace('{when}', relativeTime(iso(nextSyncAt), lang, 'long')),
        ]}
      />
    </p>
  )
}
