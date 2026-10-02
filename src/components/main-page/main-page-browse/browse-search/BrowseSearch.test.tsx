import { fireEvent, render, screen } from '@testing-library/react'
import BrowseSearch from './BrowseSearch'
import { en } from '@/translations/en'
import type { LibraryGame } from '@/utils/library'

const game = (id: number, title: string, source: 'ra' | 'steam', status: LibraryGame['status']): LibraryGame => ({
  key: `${source}:${id}`, source, id, title, subtitle: source === 'ra' ? 'SNES' : 'Steam', status, pct: 50, href: `/x/${id}`,
})
const LIB = [game(1, 'Pokémon Emerald', 'ra', 'playing'), game(2, 'Portal 2', 'steam', 'completed'), game(3, 'Zelda', 'ra', 'wantToPlay')]

test('the search box has a visible label', () => {
  render(<BrowseSearch library={LIB} />)
  expect(screen.getByLabelText(en.cards.searchTitle)).toBeInTheDocument()
})

test('typing narrows the list, accents aside', () => {
  render(<BrowseSearch library={LIB} />)
  fireEvent.change(screen.getByLabelText(en.cards.searchTitle), { target: { value: 'pokemon' } })
  const links = screen.getAllByRole('link')
  expect(links).toHaveLength(1)
  expect(links[0]).toHaveTextContent('Pokémon Emerald')
})

test('platform and status chips are toggles that filter', () => {
  render(<BrowseSearch library={LIB} />)
  const steam = screen.getByRole('button', { name: 'Steam' })
  fireEvent.click(steam)
  expect(steam).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getAllByRole('link')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: en.categories.wantToPlay }))
  expect(screen.getByText(en.cards.noMatches)).toBeInTheDocument()
})

test('says how many more there are beyond the first four', () => {
  const many = Array.from({ length: 11 }, (_, i) => game(i, `Game ${i}`, 'ra', 'playing'))
  render(<BrowseSearch library={many} />)
  expect(screen.getAllByRole('link')).toHaveLength(4)
  expect(screen.getByText(en.cards.moreMatches.replace('{n}', '7'))).toBeInTheDocument()
})
