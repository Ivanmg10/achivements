import { render, screen } from '@testing-library/react'
import BrowseConsoles from './BrowseConsoles'
import { en } from '@/translations/en'

test('a tile per console, with its games, its share at 100% and a link to it', () => {
  render(<BrowseConsoles consoles={[{ consoleId: 21, console: 'PlayStation 2', games: 12, completed: 6, pct: 50 }]} />)
  expect(screen.getByText(en.cards.consolesTitle)).toBeInTheDocument()
  const tile = screen.getByRole('link')
  expect(tile).toHaveAttribute('href', '/playing/21')
  expect(tile).toHaveTextContent('PlayStation 2')
  expect(tile).toHaveTextContent(en.cards.nGames.replace('{n}', '12'))
  expect(tile).toHaveTextContent('50%')
})

test('no consoles, nothing drawn', () => {
  const { container } = render(<BrowseConsoles consoles={[]} />)
  expect(container).toBeEmptyDOMElement()
})

test('one game is said in the singular', () => {
  render(<BrowseConsoles consoles={[{ consoleId: 4, console: 'Game Boy', games: 1, completed: 1, pct: 100 }]} />)
  expect(screen.getByRole('link')).toHaveTextContent(en.cards.oneGame)
})
