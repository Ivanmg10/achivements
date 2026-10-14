/**
 * How a shelf's cards are laid out on its grid, different on every visit but
 * always in the same spirit: four small cards across the top, then blocks that
 * each fill whole rows (a featured game with four beside it, a wide game and
 * two small, two wide ones, a row of four), put together at random until the
 * games run out. Blocks fill whole rows, so the grid never has holes.
 */

export type CardSize = 'feature' | 'wide' | 'compact'

/** Where a card sits: on the left of its row as usual, or on the right (the cards after it fill the left). */
export type Cell = { size: CardSize; right: boolean }

type Block = { cells: Cell[]; weight: number }

const c: Cell = { size: 'compact', right: false }
const feature = (right: boolean): Cell => ({ size: 'feature', right })
const wide = (right: boolean): Cell => ({ size: 'wide', right })

/** The cards on the top row of every shelf. */
export const TOP_ROW = 4

const BLOCKS: Block[] = [
  // a featured game two columns wide and two rows tall, with four small ones beside it
  { cells: [feature(false), c, c, c, c], weight: 3 },
  { cells: [feature(true), c, c, c, c], weight: 3 },
  // one wide game and two small, in one row
  { cells: [wide(false), c, c], weight: 2 },
  { cells: [wide(true), c, c], weight: 2 },
  // two wide
  { cells: [wide(false), wide(false)], weight: 1 },
  // a plain row of four
  { cells: [c, c, c, c], weight: 1 },
]

/** A small seeded generator (mulberry32): the same seed gives the same layout, which is what a test needs. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The cards for `count` games. After the top row, blocks are chosen at random
 * among those that fit what is left without stranding a single card (one card
 * cannot make a block of its own, so a remainder of one is never left).
 */
export function bentoCells(count: number, random: () => number): Cell[] {
  const out: Cell[] = Array.from({ length: Math.min(TOP_ROW, count) }, () => c)
  let left = count - out.length

  while (left > 0) {
    if (left === 1) {
      // Only possible when the whole shelf has five games: the last one is wide, not lost in a corner.
      out.push(wide(false))
      break
    }
    const fits = BLOCKS.filter((b) => b.cells.length <= left && left - b.cells.length !== 1)
    const total = fits.reduce((sum, b) => sum + b.weight, 0)
    let pick = random() * total
    const block = fits.find((b) => (pick -= b.weight) < 0) ?? fits[fits.length - 1]
    out.push(...block.cells)
    left -= block.cells.length
  }
  return out
}
