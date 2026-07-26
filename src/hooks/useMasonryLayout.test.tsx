import { render } from '@testing-library/react'
import { useMasonryLayout, MasonryPosition } from './useMasonryLayout'

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return Number(this.getAttribute('data-width')) || 0
  },
})
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return Number(this.getAttribute('data-height')) || 0
  },
})

let lastResult: { positions: MasonryPosition[]; containerHeight: number } = {
  positions: [],
  containerHeight: 0,
}

function Harness({
  containerWidth,
  heights,
  columns,
  gap = 10,
}: {
  containerWidth: number
  heights: number[]
  columns: number
  gap?: number
}) {
  const { containerRef, setItemRef, positions, containerHeight } = useMasonryLayout(
    heights.length,
    columns,
    gap,
  )
  lastResult = { positions, containerHeight }
  return (
    <div ref={containerRef} data-width={containerWidth}>
      {heights.map((h, i) => (
        <div key={i} ref={setItemRef(i)} data-height={h} />
      ))}
    </div>
  )
}

test('packs each item into the column with the least accumulated height', () => {
  render(<Harness containerWidth={650} heights={[100, 50, 80, 20]} columns={2} gap={10} />)

  expect(lastResult.positions).toEqual([
    { top: 0, left: 0, width: 320 },
    { top: 0, left: 330, width: 320 },
    { top: 60, left: 330, width: 320 },
    { top: 110, left: 0, width: 320 },
  ])
  expect(lastResult.containerHeight).toBe(140)
})

test('collapses to a single column below the sm breakpoint regardless of requested columns', () => {
  render(<Harness containerWidth={500} heights={[100, 100]} columns={3} />)

  expect(lastResult.positions.every((p) => p.left === 0)).toBe(true)
  expect(lastResult.positions[0].width).toBe(500)
})

test('caps at 2 columns between the sm and lg breakpoints', () => {
  render(<Harness containerWidth={700} heights={[100, 100, 100]} columns={3} />)

  const distinctLefts = new Set(lastResult.positions.map((p) => p.left))
  expect(distinctLefts.size).toBe(2)
})

test('uses the full requested column count at/above the lg breakpoint', () => {
  render(<Harness containerWidth={1200} heights={[100, 100, 100]} columns={3} />)

  const distinctLefts = new Set(lastResult.positions.map((p) => p.left))
  expect(distinctLefts.size).toBe(3)
})

test('returns zero height for an empty item list', () => {
  render(<Harness containerWidth={300} heights={[]} columns={2} />)

  expect(lastResult.positions).toEqual([])
  expect(lastResult.containerHeight).toBe(0)
})
