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

/** An achievement's badge: 52 px; earned in hardcore ringed in its colour, softcore in its own, locked greyed. */
export function badgeClass(state: 'hardcore' | 'softcore' | 'locked') {
  const RING = {
    hardcore: 'shadow-[0_0_0_2px_rgb(var(--bg-card)),0_0_0_4px_rgb(var(--hardcore))]',
    softcore: 'shadow-[0_0_0_2px_rgb(var(--bg-card)),0_0_0_4px_rgb(var(--softcore))]',
    locked: '',
  }
  return `block w-[3.25rem] h-[3.25rem] rounded-[0.625rem] ${RING[state]}`
}

/** The picture inside a badge: a locked one grey and faint. */
export function badgeImgClass(locked: boolean) {
  return `w-full h-full object-cover rounded-[0.625rem] ${locked ? 'grayscale opacity-40' : ''}`
}

/** An achievement's type (progression, missable…) beside its title. */
export const TYPE_TAG = 'inline-flex items-center h-5 px-2 rounded-[0.375rem] text-[0.6875rem] font-bold whitespace-nowrap'
