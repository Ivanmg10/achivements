'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useFollowCounts } from '@/hooks/useFollowCounts'
import { plural } from '@/utils/utils'
import { Skeleton } from '@/components/ui/Skeleton'

const LINK = 'hover:text-text-main hover:underline underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/**
 * How many you follow and how many follow you, in the line under your name,
 * each opening its list on the Following page (followers: `#followers`, a list
 * only you see).
 */
export default function UserFollowStats() {
  const { T, lang } = useLanguage()
  const { counts, isLoading, error } = useFollowCounts()
  if (error) return <span role="alert" className="text-danger">{T.following.countsError}</span>
  // As wide as the two counts: on a phone they take a second line, and the block must too.
  if (isLoading || !counts) return <Skeleton className="inline-block h-3 w-44 max-w-full align-middle" />

  return (
    <>
      <Link href="/following" className={LINK}>{plural(counts.following, T.plurals.following, lang)}</Link>
      <span aria-hidden="true"> · </span>
      <Link href="/following#followers" className={LINK}>{plural(counts.followers, T.plurals.followers, lang)}</Link>
    </>
  )
}
