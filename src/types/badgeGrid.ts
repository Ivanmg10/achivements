import type { ReactNode } from 'react'
import type { PinControl, RevealControl } from '@/types/achievementTable'

/** The details a badge shows when it is hovered or focused: what it is, and its facts as chips. */
export type BadgeTip = {
  description: string
  /** After the description: the platform's own facts, rarity and earned. */
  chips: ReactNode
  /** The day it was earned, already formatted. */
  date?: string | null
}

/** The viewer's pins on this game: a star in a badge's corner. */
export type BadgePins<T> = Pick<PinControl<T>, 'canPin' | 'isPinned' | 'toggle'>

/** The eye on a badge whose text is a secret until earned. */
export type BadgeReveal<T> = Pick<RevealControl<T>, 'isRevealed' | 'toggle'> & {
  /** What the eye does in each state. */
  labels: { reveal: string; conceal: string }
}

/** A part of the grid (a DLC group), when the platform splits it. */
export type BadgeSection<T> = { id: string; items: T[] }
