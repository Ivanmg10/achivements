import { render, screen, fireEvent } from '@testing-library/react'
import GameInfoTableFoldBar from './GameInfoTableFoldBar'
import { en } from '@/translations/en'

test('open: offers to fold, with the count the filter leaves', () => {
  const onToggle = jest.fn()
  render(<GameInfoTableFoldBar expanded onToggle={onToggle} shown={12} total={50} />)
  const bar = screen.getByRole('button', { name: new RegExp(en.gameInfoTable.collapseTable) })
  expect(bar).toHaveAttribute('aria-expanded', 'true')
  expect(bar).toHaveTextContent('12 / 50')
  fireEvent.click(bar)
  expect(onToggle).toHaveBeenCalled()
})

test('folded: offers to open, saying how many', () => {
  render(<GameInfoTableFoldBar expanded={false} onToggle={jest.fn()} shown={12} total={50} />)
  expect(screen.getByRole('button')).toHaveTextContent(`${en.gameInfoTable.expandTable} (12)`)
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
})
