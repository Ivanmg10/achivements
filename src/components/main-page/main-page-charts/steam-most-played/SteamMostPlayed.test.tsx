import { render, screen } from '@testing-library/react'
import SteamMostPlayed from './SteamMostPlayed'
import { en } from '@/translations/en'
import type { SteamGameProgress } from '@/types/steam'

const game = (id: number, minutes: number) =>
  ({ id, title: `Game ${id}`, imageIcon: '', playtimeForever: minutes }) as SteamGameProgress

test('the most played first, at most five, each linking to its page', () => {
  render(<SteamMostPlayed games={[1, 2, 3, 4, 5, 6].map((id) => game(id, id * 60))} />)
  expect(screen.getByText(en.cards.mostPlayed)).toBeInTheDocument()
  const links = screen.getAllByRole('link')
  expect(links).toHaveLength(5)
  expect(links[0]).toHaveAttribute('href', '/steamGame/6')
})

test('nothing played, nothing shown', () => {
  const { container } = render(<SteamMostPlayed games={[game(1, 0)]} />)
  expect(container).toBeEmptyDOMElement()
})
