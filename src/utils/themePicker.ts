import type { Theme } from '@/types/types'

export const BASES = ['dark', 'tinted', 'light'] as const
export type Base = (typeof BASES)[number]

/** `mono` is white on the dark base and black on the light one; the tinted base has none. */
export const ACCENTS = ['violet', 'red', 'green', 'blue', 'mono'] as const
export type Accent = (typeof ACCENTS)[number]

/**
 * The 14 basic themes as a base and an accent (canvas "TemBasicos", #135). The picker
 * only translates a pair into one of these ids, so what is stored and the favicon never change.
 */
const PAIRS: Record<Base, Partial<Record<Accent, Theme>>> = {
  dark: { violet: 'dark', red: 'dark-red', green: 'dark-green', blue: 'dark-blue', mono: 'dark-white' },
  tinted: { violet: 'purple', red: 'red', green: 'green', blue: 'blue' },
  light: { violet: 'light', red: 'light-red', green: 'light-green', blue: 'light-blue', mono: 'light-black' },
}

/** The 8 themes with their own grounds and surfaces, which no base and accent can make: the palettes, then the tributes. */
export const NAMED_THEMES: { id: Theme; kind: 'palette' | 'tribute' }[] = [
  { id: 'midnight', kind: 'palette' },
  { id: 'crimson', kind: 'palette' },
  { id: 'sakura', kind: 'palette' },
  { id: 'arctic', kind: 'palette' },
  { id: 'black-ops-2', kind: 'tribute' },
  { id: 'steam-retro', kind: 'tribute' },
  { id: 'snake-eater', kind: 'tribute' },
  { id: 'venom', kind: 'tribute' },
]

/** The theme a pair is, or null when that pair has none (tinted with white or black). */
export function themeFor(base: Base, accent: Accent): Theme | null {
  return PAIRS[base][accent] ?? null
}

/** The pair a basic theme is made of; null for a named one. */
export function pairOf(theme: Theme): { base: Base; accent: Accent } | null {
  for (const base of BASES) {
    for (const accent of ACCENTS) if (PAIRS[base][accent] === theme) return { base, accent }
  }
  return null
}

/**
 * Where a pick lands. A base keeps the accent on when it has it, else violet; an accent goes on the base
 * that is on, or the dark one while a named theme is. Null for a pair that has no theme (it is not offered).
 */
export function pickBase(base: Base, accent: Accent | undefined): Theme {
  return themeFor(base, accent ?? 'violet') ?? themeFor(base, 'violet')!
}

export function pickAccent(base: Base | undefined, accent: Accent): Theme | null {
  return themeFor(base ?? 'dark', accent)
}
