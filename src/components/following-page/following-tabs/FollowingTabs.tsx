'use client'

import { useLanguage } from '@/context/LanguageContext'

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
    <div role="tablist" aria-label={T.following.tabsLabel} className="self-start flex gap-1 bg-bg-card rounded-full p-1">
      {tabs.map((t) => {
        const on = t.id === tab
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onTab(t.id)}
            className={`inline-flex items-center gap-1.5 min-h-9 px-4 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              on ? 'bg-bg-main font-bold text-text-main ring-1 ring-accent/40' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {t.label}
            {t.n !== undefined && <span className="tabular-nums text-xs text-text-secondary">{t.n.toLocaleString(lang)}</span>}
          </button>
        )
      })}
    </div>
  )
}
