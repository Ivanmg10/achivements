import type { ReactNode } from 'react'
import type { GameGroupItem } from '@/types/types'
import type { GameSource } from '@/types/game'

/** The colour a cover's ring takes when the game is done (RA's is hardcore); none leaves only the hover ring. */
export type CoverRing = 'hardcore' | 'steam-perfect' | 'platinum' | 'success'

/** "x / y achievements", its bar and its percentage. `pct` null: no bar (nothing to tell yet). */
export type CardProgress = {
  text: string
  /** Done: the text and the percentage take the success colour. */
  done: boolean
  /** The bright bar (RA's hardcore share). */
  pct: number | null
  /** RA's softcore share, darker behind the bar. */
  softPct?: number
}

/** The words of the button that opens a game's achievements or trophies; the game's title follows them. */
export type ExpandLabels = { show: string; hide: string }

/** What a platform tells the group game card; the card draws it and owns dragging, removing and opening. */
export type GroupGameCardView = {
  href: string
  title: string
  /** The art the card's tint is read from. */
  backdrop: string | null
  /** The cover's picture, sized by `COVER_IMAGE`. */
  cover: ReactNode
  ring?: CoverRing
  chips?: ReactNode
  progress: CardProgress
  /** The line under the bar (points, play time, gamerscore). Nothing keeps its room, so every card is as tall. */
  detail?: ReactNode
  lastPlayed?: string | null
  /** A fact between "played" and "added" (Xbox's play time). */
  fact?: string | false
  expand: ExpandLabels
  /** The opened achievements; mounted the first time the card opens and kept, so closing slides. */
  panel: (open: boolean) => ReactNode
}

export type GroupGameCardProps = GroupGameCardView & {
  item: GameGroupItem
  onRemove: (id: number) => void
  draggable: boolean
}

/** What a platform tells the status card; the card draws it and owns the open state, hide and pin. */
export type StatusGameCardView = {
  /** Which game this is: the exclusive-open key is `<source>:<id>`, and hide and pin take both. */
  source: 'ra' | 'steam' | 'psn' | 'xbox'
  gameId: number
  href: string
  title: string
  backdrop: string | null
  /** The picture hide keeps with the game. */
  hideImage: string | null
  cover: ReactNode
  ring?: CoverRing
  chips?: ReactNode
  progress: CardProgress
  expand: ExpandLabels
  /** The opened detail, shown in its own row of the grid; only mounted while open. */
  detail: ReactNode
  /** The lines under the bar. */
  children?: ReactNode
}

/** What a platform tells the home's pinned row; the row draws it and owns dragging, the pin and opening. */
export type PinnedGameCardView = {
  href: string
  title: string
  backdrop: string | null
  /** The picture, sized by `COVER_ROW_IMAGE`. */
  cover: ReactNode
  /** The platform's logo and name (or the console's), small, before the bar. */
  platform: ReactNode
  /** The bar; none leaves the row without one (nothing to count yet). */
  progress: { pct: number; softPct?: number } | null
  /** The line under the bar (how many, gamerscore); none leaves it out. */
  counts?: ReactNode
  expand: ExpandLabels
  /** The opened achievements or trophies; only mounted while open. */
  panel: ReactNode
}

/** The colour of a feed row's icon ring when the game is done (a platinum, a perfect game, a mastery). */
export type FeedRing = 'platinum' | 'success' | 'warning'

/** The bar of a feed row and its percentage. `percent` is what is written; `done` turns the written one green. */
export type FeedProgress = { pct: number; /** RA's softcore share, darker behind the bar. */ softPct?: number; percent: number; done: boolean }

/** What a platform tells the recent feed's row; the row draws it and owns the open state, the links and the expand button. */
export type FeedGameCardView = {
  /** The game's page. None (a PSN collection): the title and icon are plain, the whole row opens. */
  href?: string
  title: string
  backdrop: string | null
  /** The icon, drawn with the class that sizes, shadows and rings it. */
  icon: (className: string) => ReactNode
  /** Over the icon's corner (RA's console). */
  iconBadge?: ReactNode
  /** The ring when the game is done. */
  ring?: FeedRing
  /** The platform's chip: its logo and name, or the console's. */
  platform: { source?: 'steam' | 'psn' | 'xbox'; label: string }
  /** The bar; none leaves the row with only its chevron (nothing to count yet). */
  progress: FeedProgress | null
  /** The line under the bar, joined by the site's mark; empty ones are left out. */
  facts: ReactNode[]
  /** What the row's button says; none (an example with nothing to open) leaves the row closed and plain. */
  expand?: ExpandLabels
  /** The game's pin, outside the expand button; none (a collection) leaves it out. */
  pin?: { gameId: number; source?: GameSource }
  /** Controlled by the feed (one row open at a time) when `expanded` and `onToggle` come; local otherwise. */
  expanded?: boolean
  onToggle?: () => void
  className?: string
  /** The opened achievements or trophies, only while open. */
  children?: ReactNode
}
