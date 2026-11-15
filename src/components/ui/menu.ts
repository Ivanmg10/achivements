/**
 * A menu's surface and its items (the header's status menu, the sort menu, the
 * Select's list): the card's colour, a fine ring, a deep shadow; an item lights
 * up with the accent. The behaviour (open, close, keys) stays with each menu.
 */
export const MENU_SURFACE = 'p-1 rounded-control bg-bg-card ring-1 ring-ink/10 shadow-xl shadow-black/40'

export function menuItemClass(active = false, className = '') {
  return (
    'flex w-full items-center gap-2.5 px-3 py-2 rounded-chip text-sm text-left whitespace-nowrap cursor-pointer transition-colors duration-(--motion-hover) ' +
    'hover:bg-accent/12 hover:text-text-main focus-visible:outline-none focus-visible:bg-accent/12 focus-visible:text-text-main ' +
    (active ? 'text-accent font-semibold ' : 'text-text-secondary ') +
    className
  )
}
