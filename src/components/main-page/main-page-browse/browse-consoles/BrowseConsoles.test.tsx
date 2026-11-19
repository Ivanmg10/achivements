import { render, screen } from '@testing-library/react'
import BrowseConsoles from './BrowseConsoles'
import { en } from '@/translations/en'
import type { ConsoleTile } from '@/utils/library'

const tile = (over: Partial<ConsoleTile>): ConsoleTile => ({ key: 'ra:21', source: 'ra', name: 'PlayStation 2', consoleId: 21, games: 12, completed: 6, pct: 50, href: '/playing/21', ...over })

test('a tile per console, with its games, its share at 100% and a link to it', () => {
  render(<BrowseConsoles consoles={[tile({})]} />)
  expect(screen.getByText(en.cards.consolesTitle)).toBeInTheDocument()
  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', '/playing/21')
  expect(link).toHaveTextContent('PlayStation 2')
  expect(link).toHaveTextContent(en.cards.nGames.replace('{n}', '12'))
  expect(link).toHaveTextContent('50%')
  expect(link.querySelector('img')).toHaveAttribute('src', expect.stringContaining('ps2.png'))
})

test('a PlayStation or Steam console without its icon yet shows the platform logo', () => {
  const { container } = render(
    <BrowseConsoles
      consoles={[
        tile({ key: 'psn:PS4', source: 'psn', name: 'PS4', consoleId: undefined, href: '/allGames?platform=psn' }),
        tile({ key: 'steam', source: 'steam', name: 'Steam', consoleId: undefined, href: '/allGames?platform=steam' }),
      ]}
    />,
  )
  expect(screen.getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/allGames?platform=psn', '/allGames?platform=steam'])
  expect(container.querySelectorAll('svg')).toHaveLength(2)
})

test('no consoles, nothing drawn', () => {
  const { container } = render(<BrowseConsoles consoles={[]} />)
  expect(container).toBeEmptyDOMElement()
})

test('one game is said in the singular', () => {
  render(<BrowseConsoles consoles={[tile({ games: 1, completed: 1, pct: 100 })]} />)
  expect(screen.getByRole('link')).toHaveTextContent(en.cards.oneGame)
})
