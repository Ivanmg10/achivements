import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import FoldList, { foldItem } from './FoldList'

const ROWS = Array.from({ length: 5 }, (_, i) => `Row ${i}`)

function List({ startOpen = false, rows = ROWS }: { startOpen?: boolean; rows?: string[] }) {
  const [folded, setFolded] = useState(!startOpen)
  const shown = folded ? rows.slice(0, 2) : rows
  return (
    <FoldList folded={folded} onToggle={() => setFolded((f) => !f)} hasMore={rows.length > 2} more="Show the other 3" less="Show fewer">
      <ul>
        {shown.map((r, i) => (
          <li key={r} {...foldItem(i, 2)}>
            <button type="button">{r}</button>
          </li>
        ))}
      </ul>
    </FoldList>
  )
}

afterEach(() => jest.useRealTimers())

test('folded, it shows the first rows only (the rest are out of the tab order) and fades the last one', () => {
  const { container } = render(<List />)
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(container.firstElementChild).toHaveClass('fold-fade')
  expect(screen.getByRole('button', { name: 'Show the other 3' })).toHaveAttribute('aria-expanded', 'false')
})

test('unfolding brings the rest in with the rows entrance, only while it unfolds', () => {
  jest.useFakeTimers()
  const { container } = render(<List />)
  fireEvent.click(screen.getByRole('button', { name: 'Show the other 3' }))
  expect(screen.getAllByRole('listitem')).toHaveLength(5)
  const box = container.firstElementChild!
  expect(box).not.toHaveClass('fold-fade')
  expect(box).toHaveAttribute('data-unfolding')
  expect(screen.getAllByRole('listitem')[3]).toHaveAttribute('data-fold-new')
  act(() => jest.advanceTimersByTime(1000))
  expect(box).not.toHaveAttribute('data-unfolding')
})

test('folding shrinks it back, then drops the rows and gives the button its focus', () => {
  jest.useFakeTimers()
  render(<List />)
  fireEvent.click(screen.getByRole('button', { name: 'Show the other 3' }))
  fireEvent.click(screen.getByRole('button', { name: 'Show fewer' }))
  expect(screen.getAllByRole('listitem')).toHaveLength(5)
  act(() => jest.advanceTimersByTime(600))
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByRole('button', { name: 'Show the other 3' })).toHaveFocus()
})

test('opened some other way, it folds at once', () => {
  render(<List startOpen />)
  fireEvent.click(screen.getByRole('button', { name: 'Show fewer' }))
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByRole('button', { name: 'Show the other 3' })).toHaveFocus()
})

test('a list within its cap has no button and no fade', () => {
  const { container } = render(<List rows={['A', 'B']} />)
  expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument()
  expect(container.firstElementChild).not.toHaveClass('fold-fade')
})

test('foldItem marks only the items past the cap, staggered and capped at 11', () => {
  expect(foldItem(1, 2)).toEqual({})
  expect(foldItem(2, 2)).toEqual({ 'data-fold-new': '', style: { '--i': 0 } })
  expect(foldItem(40, 2).style).toEqual({ '--i': 11 })
})
