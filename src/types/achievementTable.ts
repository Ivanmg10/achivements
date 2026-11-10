import type { ReactNode } from 'react'
import type { SortDir, TableEntry } from '@/utils/achievementTable'

/** What a platform calls things in its game page table. */
export type TableTexts = {
  /** The section's and the filters' accessible name. */
  label: string
  /** The name column's head. */
  name: string
  /** A filter that leaves nothing. */
  none: string
  earned: string
  locked: string
  /** A secret one's stand-ins until it is earned or revealed. */
  secret?: string
  secretText?: string
  /** The eye on one, and the button for them all: only where they can be revealed. */
  reveal?: string
  conceal?: string
  revealAll?: string
  concealAll?: string
}

/** A column between the name and the pin: the platform's own (grade, gamerscore, players, points), rarity and earned. */
export type AchievementColumn<T> = {
  key: string
  label: string
  align: 'center' | 'right'
  /** Its width, a Tailwind class (`w-24`). */
  width?: string
  cell: (e: TableEntry<T>) => ReactNode
  /** Sortable: the direction of a first click, and the number it orders by (rarity and earned have their own rules). */
  sort?: { first: SortDir; value?: (e: TableEntry<T>) => number }
  /** Its chip on the phone card, before the unlock. */
  card?: (e: TableEntry<T>) => ReactNode
  /** After the earned column (RA's points), not before rarity. */
  end?: boolean
}

/** The viewer's pins on this game. `leads`: pinned when the page loaded, so pinning now leaves the row where it is. */
export type PinControl<T> = {
  canPin: boolean
  isPinned: (t: T) => boolean
  leads: (t: T) => boolean
  toggle: (t: T) => void
}

/** Which secret ones the viewer chose to see (`useRevealedTrophies`, `useRevealedAchievements`). */
export type RevealControl<T> = {
  isRevealed: (t: T) => boolean
  toggle: (t: T) => void
  setAll: (items: T[], reveal: boolean) => void
}

/** One achievement as the row and the card draw it: the platform's words already chosen. */
export type AchievementView<T> = {
  entry: TableEntry<T>
  title: string
  text: string
  /** Null for a secret one still hidden (Steam keeps its picture). */
  iconUrl: string | null
  highlighted: boolean
  /** Undefined when the viewer cannot pin. */
  pinned?: boolean
  onTogglePin: () => void
  onOpen: () => void
  /** The eye, on a secret one not yet earned where it can be revealed. */
  eye?: { revealed: boolean; onToggle: () => void; labels: { reveal: string; conceal: string } }
}

/** What the detail window starts from; the platform adds its tags, guides and showcase, or draws its own (RA). */
export type DetailBase = {
  title: string
  description: string
  iconUrl: string | null
  earned: boolean
  earnedAt: string | null
  rarity: number | null
  concealed: boolean
  pinned?: boolean
  onTogglePin: () => void
  onClose: () => void
}
