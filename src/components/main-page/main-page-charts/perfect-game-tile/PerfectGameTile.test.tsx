import { render, screen } from '@testing-library/react'
import PerfectGameTile from './PerfectGameTile'
import { en } from '@/translations/en'
import type { PerfectGame } from '@/utils/perfectGames'

const ra: PerfectGame = { key: 'ra:5', source: 'ra', id: 5, title: 'Zelda', subtitle: 'SNES', hardcore: true, imageUrl: 'https://retroachievements.org/Images/5.png' }
const steam: PerfectGame = { key: 'steam:620', source: 'steam', id: 620, title: 'Portal 2', subtitle: 'Steam', hardcore: false }

test('links to the game, named by its title and described by its tooltip', () => {
  render(<PerfectGameTile game={ra} date="2026-08-09T10:00:00Z" />)
  const link = screen.getByRole('link', { name: 'Zelda' })
  expect(link).toHaveAttribute('href', '/gameInfo/5')
  const tip = screen.getByRole('tooltip')
  expect(link).toHaveAttribute('aria-describedby', tip.id)
  expect(tip).toHaveTextContent('SNES · Hardcore')
  expect(tip).toHaveTextContent(en.cards.perfectOn.replace('{date}', '09 Aug 2026'))
})

test('for Steam the date is the last session, and says so', () => {
  render(<PerfectGameTile game={steam} date="2026-09-07T10:00:00Z" />)
  expect(screen.getByRole('link', { name: 'Portal 2' })).toHaveAttribute('href', '/steamGame/620')
  expect(screen.getByRole('tooltip')).toHaveTextContent(en.cards.lastPlayedOn.replace('{date}', '07 Sept 2026'))
})

test('without a date the tooltip still names the game', () => {
  render(<PerfectGameTile game={ra} />)
  expect(screen.getByRole('tooltip')).toHaveTextContent('Zelda')
  expect(screen.getByRole('tooltip')).not.toHaveTextContent('100%')
})
