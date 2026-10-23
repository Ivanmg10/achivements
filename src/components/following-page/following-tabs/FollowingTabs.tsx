'use client'

import { useLanguage } from '@/context/LanguageContext'
import Tabs from '@/components/ui/Tabs'

export type FollowingTab = 'following' | 'followers'

/** Whom you follow or who follows you, each with how many; the chosen one is marked by more than its colour. */
export default function FollowingTabs({
  tab,
  onTab,
  counts,
}: {
  tab: FollowingTab
  onTab: (tab: FollowingTab) => void
  counts: { following?: number; followers?: number } | null
}) {
  const { T, lang } = useLanguage()
  const tabs: { id: FollowingTab; label: string; n?: number }[] = [
    { id: 'following', label: T.following.title, n: counts?.following },
    { id: 'followers', label: T.following.followers, n: counts?.followers },
  ]

  return (
    <Tabs
      id="following"
      aria-label={T.following.tabsLabel}
      value={tab}
      onChange={onTab}
      tabs={tabs.map((t) => ({ value: t.id, label: t.label, count: t.n?.toLocaleString(lang) }))}
    />
  )
}
