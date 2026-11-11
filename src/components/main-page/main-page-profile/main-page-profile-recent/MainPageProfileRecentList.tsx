'use client'

import type { ComponentProps, ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { formatDate } from '@/utils/dates'
import MainPageProfileRecent from './MainPageProfileRecent'
import MainPageProfileRecentRow from './main-page-profile-recent-row/MainPageProfileRecentRow'

export type RecentItem = {
  key: string
  /** Where it opens: the achievement on its game's page. */
  href: string
  badge: string | null
  /** Ringed when earned in hardcore (RA). */
  hardcore?: boolean
  title: string
  gameTitle: string
  /** When it was earned, as the platform sends it. */
  at: string
  /** The figure on the right (points, gamerscore, grade). */
  right?: ReactNode
}

const SHOWN = 3

/**
 * The player's latest unlocks, the same list on every platform: the rows are the adapter's mapping
 * (`items`, newest first), this draws the first three with the game and the day under each name.
 */
export default function MainPageProfileRecentList({ items, ...frame }: { items: RecentItem[] } & Omit<ComponentProps<typeof MainPageProfileRecent>, 'children'>) {
  const { lang } = useLanguage()
  return (
    <MainPageProfileRecent {...frame}>
      {items.slice(0, SHOWN).map((i) => (
        <MainPageProfileRecentRow
          key={i.key}
          href={i.href}
          badge={i.badge}
          hardcore={i.hardcore}
          title={i.title}
          sub={<>{i.gameTitle} · <time dateTime={i.at}>{formatDate(i.at, lang, { day: 'numeric', month: 'short' })}</time></>}
          right={i.right}
        />
      ))}
    </MainPageProfileRecent>
  )
}
