import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

/**
 * Columns the grid control asks for, fewer on narrower screens. The lists and
 * their skeleton both read this, so the skeleton lands on the real boxes.
 */
export const STATUS_GRID_COLS: Record<StatusGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2 grid-flow-row-dense',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row-dense',
}
