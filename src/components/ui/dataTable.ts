/**
 * The achievement tables' look (RA, Steam, PlayStation, Xbox), as agreed on the
 * canvas: small uppercase headers on a hairline, rows divided by a fainter one,
 * and on hover a tint with the accent's edge on the first cell. Numbers right
 * aligned, rarity centred.
 */
export const TABLE = 'w-full border-separate border-spacing-0'

export const TH =
  'px-3 py-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-text-secondary whitespace-nowrap shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)]'

/** A row: `group` so its cells tint together on hover. */
export const ROW = 'group relative'

export const TD =
  'px-3 py-2.5 align-middle text-sm shadow-[inset_0_-1px_0_rgb(var(--ink)/0.05)] transition-colors duration-(--motion-hover) group-hover:bg-accent/[0.06]'

/** The first cell also draws the accent's edge on hover. */
export const TD_FIRST = `${TD} group-hover:shadow-[inset_2px_0_0_rgb(var(--accent)),inset_0_-1px_0_rgb(var(--ink)/0.05)]`

export const NUM = 'text-right tabular-nums whitespace-nowrap'
export const MID = 'text-center'

/** An achievement's badge: 52 px; earned in hardcore ringed in its colour, softcore in its own, earned elsewhere in the accent, locked greyed. */
export function badgeClass(state: 'hardcore' | 'softcore' | 'earned' | 'locked') {
  const RING = {
    hardcore: 'shadow-[0_0_0_2px_rgb(var(--bg-card)),0_0_0_4px_rgb(var(--hardcore))]',
    earned: 'shadow-[0_0_0_2px_rgb(var(--bg-card)),0_0_0_4px_rgb(var(--accent))]',
    softcore: 'shadow-[0_0_0_2px_rgb(var(--bg-card)),0_0_0_4px_rgb(var(--softcore))]',
    locked: '',
  }
  return `block w-[3.25rem] h-[3.25rem] rounded-tile ${RING[state]}`
}

/** The picture inside a badge: a locked one grey and faint. */
export function badgeImgClass(locked: boolean) {
  return `w-full h-full object-cover rounded-tile ${locked ? 'grayscale opacity-40' : ''}`
}

/** An achievement's type (progression, missable…) beside its title. */
export const TYPE_TAG = 'inline-flex items-center h-5 px-2 rounded-tag text-[0.6875rem] font-bold whitespace-nowrap'

/** RA's achievement types as a tag: its label and tint, or null for a type with none. One map for every place that shows it. */
export function raTypeTag(
  type: string | null | undefined,
  labels: { progression: string; winCondition: string; missable: string },
): { label: string; className: string } | null {
  switch (type) {
    case 'progression': return { label: labels.progression, className: 'bg-info/20 text-info' }
    case 'win_condition': return { label: labels.winCondition, className: 'bg-warning/20 text-warning' }
    case 'missable': return { label: labels.missable, className: 'bg-danger/20 text-danger' }
    default: return null
  }
}
