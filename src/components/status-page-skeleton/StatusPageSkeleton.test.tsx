import { render, screen } from '@testing-library/react'
import StatusPageSkeleton from './StatusPageSkeleton'
import { en } from '@/translations/en'
import { STATUS_GRID_COLS } from '@/components/status-grid-control/statusGridCols'

test('announces loading once and hides the shapes', () => {
  const { container } = render(<StatusPageSkeleton />)
  expect(screen.getByRole('status')).toHaveTextContent(en.loadingPage.title)
  expect(container.querySelector('[role="status"] > [aria-hidden="true"]')).toBeInTheDocument()
})

test('keeps the grid the list will use, and does not cover the screen', () => {
  const { container } = render(<StatusPageSkeleton cols={3} />)
  for (const cols of [1, 2, 3] as const) {
    const grid = render(<StatusPageSkeleton cols={cols} />).container.querySelector('[aria-hidden="true"] > .grid')!
    expect(grid.className).toContain(STATUS_GRID_COLS[cols])
  }
  expect(container.querySelector('.fixed')).toBeNull()
})
