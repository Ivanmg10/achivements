import { render, screen } from '@testing-library/react'
import CollectionTile from './CollectionTile'
import { en } from '@/translations/en'
import type { PerfectGame } from '@/utils/perfectGames'

const ra: PerfectGame = { key: 'ra:5', source: 'ra', id: 5, title: 'Zelda', subtitle: 'SNES', hardcore: true, imageUrl: 'https://retroachievements.org/Images/5.png' }
const steam: PerfectGame = { key: 'steam:620', source: 'steam', id: 620, title: 'Portal 2', subtitle: 'Steam', hardcore: false }

test('shows the name, not only on hover, and links to the game', () => {
  render(<CollectionTile game={ra} date="2026-08-09T10:00:00Z" />)
  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', '/gameInfo/5')
  expect(link).toHaveTextContent('Zelda')
})

test('tells screen readers the mode and when it got to 100%', () => {
  render(<CollectionTile game={ra} date="2026-08-09T10:00:00Z" />)
  expect(screen.getByRole('link')).toHaveTextContent(`Hardcore, ${en.cards.perfectOn.replace('{date}', '09 Aug 2026')}`)
})

test('Steam: links to its page and says the date is the last session', () => {
  render(<CollectionTile game={steam} date="2026-09-07T10:00:00Z" />)
  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', '/steamGame/620')
  expect(link).toHaveTextContent(en.cards.lastPlayedOn.replace('{date}', '07 Sept 2026'))
})
