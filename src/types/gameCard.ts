import type { ReactNode } from 'react'
import type { GameGroupItem } from '@/types/types'

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
