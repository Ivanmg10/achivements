import type { CompareAchievement } from '@/utils/gameCompare'
import { TROPHY_GRADE_RING } from '@/utils/psnTitles'

export type SortDir = 'asc' | 'desc'
export type TableSort = { key: string; dir: SortDir }

/** A platform's achievement beside its row, and its place in the game's order. */
export type TableEntry<T> = { item: T; row: CompareAchievement; order: number }

/**
 * The game page table's order. `default` is the game's, `rarity` puts an unknown
 * rarity after the known ones, `earned` runs by date with the locked ones always
 * last; any other key orders by `value`, smallest first. `desc` reverses it.
 */
export function sortEntries<E extends TableEntry<unknown>>(list: E[], { key, dir }: TableSort, value?: (e: E) => number): E[] {
  const cmp = (a: E, b: E): number => {
    if (key === 'rarity') return (a.row.rarity ?? Infinity) - (b.row.rarity ?? Infinity)
    if (key === 'earned') {
      if (a.row.earned !== b.row.earned) return a.row.earned ? -1 : 1
      return (a.row.earnedAt ?? '').localeCompare(b.row.earnedAt ?? '')
    }
    return value ? value(a) - value(b) : a.order - b.order
  }
  const sorted = [...list].sort(cmp)
  if (dir === 'asc') return sorted
  if (key !== 'earned') return sorted.reverse()
  return [...sorted.filter((e) => e.row.earned).reverse(), ...sorted.filter((e) => !e.row.earned)]
}

/** The ring an earned badge wears: its grade's on PSN, hardcore or softcore on RA, the accent elsewhere. */
export function earnedRing(row: CompareAchievement): string {
  if (row.grade) return TROPHY_GRADE_RING[row.grade]
  if (row.hardcore !== undefined) return row.hardcore ? 'ring-hardcore' : 'ring-softcore'
  return 'ring-accent'
}

/** The anchor a `#fragment` points at, decoded (a Steam api name may hold any character); '' when there is none or it cannot be read. */
export function anchorOf(hash: string): string {
  try {
    return decodeURIComponent(hash.slice(1))
  } catch {
    return ''
  }
}
