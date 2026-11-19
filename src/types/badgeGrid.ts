import type { ReactNode } from 'react'
import type { RevealControl } from '@/types/achievementTable'

/** The details a badge shows when it is hovered or focused: what it is, and its facts as chips. */
export type BadgeTip = {
  description: string
  /** After the description: the platform's own facts, rarity and earned. */
  chips: ReactNode
  /** The day it was earned, already formatted. */
  date?: string | null
}

/** A badge as its window opens it: the stand-ins of a secret one still hidden, or the real name and text. */
export type BadgeShown = { concealed: boolean; title: string; text: string; iconUrl: string | null }

/** The eye on a badge whose text is a secret until earned. */
export type BadgeReveal<T> = Pick<RevealControl<T>, 'isRevealed' | 'toggle'> & {
  /** What the eye does in each state. */
  labels: { reveal: string; conceal: string }
}

/** A part of the grid (a DLC group), when the platform splits it. */
export type BadgeSection<T> = { id: string; items: T[] }
