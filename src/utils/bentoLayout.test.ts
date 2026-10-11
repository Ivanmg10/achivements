import { bentoCells, seededRandom, TOP_ROW, type Cell } from './bentoLayout'

const layoutOf = (count: number, seed: number) => bentoCells(count, seededRandom(seed))
/** Columns a card takes on the four-column grid. */
const span = (cell: Cell) => (cell.size === 'compact' ? 1 : 2)
/** Rows a card takes. */
const rows = (cell: Cell) => (cell.size === 'feature' ? 2 : 1)

describe('bentoCells', () => {
  test('always four small cards across the top, whatever the seed', () => {
    for (let seed = 1; seed <= 200; seed++) {
      expect(layoutOf(9, seed).slice(0, TOP_ROW).map((x) => x.size)).toEqual(['compact', 'compact', 'compact', 'compact'])
    }
  })

  test('one cell for every game, for any number of them', () => {
    for (let n = 0; n <= 14; n++) for (let seed = 1; seed <= 30; seed++) expect(layoutOf(n, seed)).toHaveLength(n)
  })

  test('fewer than four games are all small', () => {
    expect(layoutOf(3, 7).map((x) => x.size)).toEqual(['compact', 'compact', 'compact'])
  })

  test('what follows the top row fills whole rows: no holes in the grid', () => {
    for (let n = 6; n <= 13; n++) {
      for (let seed = 1; seed <= 100; seed++) {
        const rest = layoutOf(n, seed).slice(TOP_ROW)
        // 4 columns x some rows: the area the cards cover is a whole number of rows.
        const area = rest.reduce((sum, cell) => sum + span(cell) * rows(cell), 0)
        expect(area % 4).toBe(0)
      }
    }
  })

  test('five games: the last is wide, not alone in a corner', () => {
    expect(layoutOf(5, 3)[4].size).toBe('wide')
  })

  test('the same seed gives the same layout, and other seeds give other ones', () => {
    expect(layoutOf(9, 42)).toEqual(layoutOf(9, 42))
    const distinct = new Set(Array.from({ length: 60 }, (_, seed) => JSON.stringify(layoutOf(9, seed + 1))))
    expect(distinct.size).toBeGreaterThan(3)
  })

  test('a featured game is always followed by the four that sit beside it', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const cells = layoutOf(9, seed)
      const i = cells.findIndex((x) => x.size === 'feature')
      if (i >= 0) expect(cells.slice(i + 1, i + 5).every((x) => x.size === 'compact')).toBe(true)
    }
  })

  test('with nine games the whole range of blocks turns up over enough visits', () => {
    const sizes = new Set<string>()
    const sides = new Set<boolean>()
    for (let seed = 1; seed <= 200; seed++) {
      for (const cell of layoutOf(9, seed).slice(TOP_ROW)) {
        sizes.add(cell.size)
        if (cell.size !== 'compact') sides.add(cell.right)
      }
    }
    expect([...sizes].sort()).toEqual(['compact', 'feature', 'wide'])
    expect([...sides].sort()).toEqual([false, true])
  })
})

describe('seededRandom', () => {
  test('numbers from 0 up to 1, the same sequence for the same seed', () => {
    const a = seededRandom(5)
    const b = seededRandom(5)
    const seq = Array.from({ length: 20 }, () => a())
    expect(seq).toEqual(Array.from({ length: 20 }, () => b()))
    expect(seq.every((x) => x >= 0 && x < 1)).toBe(true)
  })
})
