import { render, screen } from '@testing-library/react'
import LibraryDetailRow from './LibraryDetailRow'
import { STATUS_GRID_COLS } from '@/components/statusGameList/StatusGameList'

test('draws nothing while closed', () => {
  render(<LibraryDetailRow open={false} id="p" title="Hades"><p>inside</p></LibraryDetailRow>)
  expect(screen.queryByText('inside')).not.toBeInTheDocument()
  expect(document.getElementById('p')).toBeNull()
})

test('opens as a row of its own, the whole width of the grid, named after the game', () => {
  render(<LibraryDetailRow open id="p" title="Hades"><p>inside</p></LibraryDetailRow>)
  const row = document.getElementById('p')!
  expect(row).toHaveClass('col-span-full')
  expect(screen.getByRole('region', { name: 'Hades' })).toContainElement(screen.getByText('inside'))
  expect(row).toContainElement(screen.getByRole('region', { name: 'Hades' }))
})

test('every grid size flows densely, so the cards after an opened one fill the gap beside it', () => {
  for (const cols of [2, 3] as const) expect(STATUS_GRID_COLS[cols]).toContain('grid-flow-row-dense')
})
