'use client'

import type { ComponentProps, ReactNode } from 'react'
import { useFitCount } from '@/hooks/useFitCount'
import DateText from '@/components/ui/DateText'
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

/** The fewest rows shown, and all a phone shows (the page scrolls there, nothing to fill). */
const SHOWN = 3

/**
 * The player's latest unlocks, the same list on every platform: the rows are the adapter's mapping
 * (`items`, newest first), this draws as many as fit the card's room (three at least, #202), with the
 * game and the day under each name; while they load, as many shapes.
 */
export default function MainPageProfileRecentList({ items, ...frame }: { items: RecentItem[] } & Omit<ComponentProps<typeof MainPageProfileRecent>, 'children' | 'rows' | 'listRef'>) {
  const [listRef, fits] = useFitCount<HTMLElement>(SHOWN, SHOWN)
  return (
    <MainPageProfileRecent {...frame} rows={fits} listRef={listRef}>
      {items.slice(0, fits).map((i) => (
        <MainPageProfileRecentRow
          key={i.key}
          href={i.href}
          badge={i.badge}
          hardcore={i.hardcore}
          title={i.title}
          sub={<>{i.gameTitle} · <DateText value={i.at} /></>}
          right={i.right}
        />
      ))}
    </MainPageProfileRecent>
  )
}
