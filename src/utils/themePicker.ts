import type { Theme } from '@/types/types'

export const BASES = ['dark', 'tinted', 'light', 'special'] as const
export type Base = (typeof BASES)[number]

/** The accents a coloured base shares; `mono` is white on the dark base and black on the light one. */
const ACCENTS = ['violet', 'red', 'green', 'blue', 'mono'] as const
export type Accent = (typeof ACCENTS)[number]

/** The second choice under a base: an accent, or a theme by its own name (a palette, a tribute). */
export type Option = Accent | Theme

export function isAccent(option: Option): option is Accent {
  return (ACCENTS as readonly string[]).includes(option)
}

/**
 * Every theme as a base and an option (the owner's table, #135). The picker only translates a pick
 * into one of these ids, so what is stored and the favicon never change.
 */
const ROWS: Record<Base, [Option, Theme][]> = {
  dark: [['violet', 'dark'], ['red', 'dark-red'], ['green', 'dark-green'], ['blue', 'dark-blue'], ['mono', 'dark-white']],
  tinted: [['violet', 'purple'], ['red', 'red'], ['green', 'green'], ['blue', 'blue'], ['crimson', 'crimson'], ['midnight', 'midnight']],
  light: [['violet', 'light'], ['red', 'light-red'], ['green', 'light-green'], ['blue', 'light-blue'], ['mono', 'light-black'], ['sakura', 'sakura'], ['arctic', 'arctic']],
  special: [['black-ops-2', 'black-ops-2'], ['snake-eater', 'snake-eater'], ['steam-retro', 'steam-retro'], ['venom', 'venom']],
}

export function optionsOf(base: Base): { option: Option; theme: Theme }[] {
  return ROWS[base].map(([option, theme]) => ({ option, theme }))
}

/** The base and the option a theme is made of. */
export function pairOf(theme: Theme): { base: Base; option: Option } {
  for (const base of BASES) {
    const row = ROWS[base].find(([, id]) => id === theme)
    if (row) return { base, option: row[0] }
  }
  throw new Error(`theme ${theme} has no place in the picker`)
}

/** Where picking a base lands: the same option when that base has it, else its first. */
export function pickBase(base: Base, option: Option): Theme {
  const row = ROWS[base]
  return (row.find(([o]) => o === option) ?? row[0])[1]
}
