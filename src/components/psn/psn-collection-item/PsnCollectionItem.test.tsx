jest.mock('@/components/psn/psn-collection-expanded/PsnCollectionExpanded', () => ({
  __esModule: true,
  default: ({ games }: { games: { title: string }[] }) => <div data-testid="expanded">{games.map((g) => g.title).join(',')}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnCollectionItem from './PsnCollectionItem'
import { en } from '@/translations/en'
import { psnGameFixture } from '@/test-utils/psnFixtures'

const EZIO = { titleId: 'CUSA04893_00', title: 'Ezio Collection', iconUrl: 'https://ezio.png', heroUrl: null, lastPlayed: '2026-10-16T00:00:00Z', playtimeMinutes: 4543 }
const GAMES = [
  psnGameFixture({ id: 1143600, titleId: 'NPWR11436_00', title: 'Brotherhood', consoleName: 'PS4', numAwarded: 38, maxPossible: 51, pctWon: 67, collection: EZIO }),
  psnGameFixture({ id: 1143500, titleId: 'NPWR11435_00', title: 'AC II', consoleName: 'PS4', numAwarded: 25, maxPossible: 51, pctWon: 48, collection: EZIO }),
]

test("one card with the collection's name, summed trophies, its hours and icon", () => {
  const { container } = render(<PsnCollectionItem collection={EZIO} games={GAMES} />)
  expect(screen.getByText('Ezio Collection')).toBeInTheDocument()
  expect(screen.getByText(`2 ${en.psn.collectionGames}`)).toBeInTheDocument()
  expect(screen.getByText(`63/102 ${en.psn.trophies.toLowerCase()}`)).toBeInTheDocument()
  expect(screen.getByText('62%')).toBeInTheDocument()
  expect(screen.getByText(`${en.steam.playtime}:`, { exact: false }).parentElement).toHaveTextContent(`76 ${en.steam.hoursShort}`)
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://ezio.png')
  // Its games stay folded until it is opened.
  expect(screen.queryByTestId('expanded')).not.toBeInTheDocument()
})

test("opening it shows the collection's games, laid out like an opened game", () => {
  render(<PsnCollectionItem collection={EZIO} games={GAMES} />)
  fireEvent.click(screen.getByRole('button', { name: `${en.psn.showGames}: Ezio Collection` }))
  expect(screen.getByTestId('expanded')).toHaveTextContent('Brotherhood,AC II')
  expect(screen.getByRole('button', { name: `${en.psn.hideGames}: Ezio Collection` })).toHaveAttribute('aria-expanded', 'true')
})

test('a controlled card asks its parent', () => {
  const onToggle = jest.fn()
  render(<PsnCollectionItem collection={EZIO} games={GAMES} expanded={false} onToggle={onToggle} />)
  fireEvent.click(screen.getByRole('button', { name: `${en.psn.showGames}: Ezio Collection` }))
  expect(onToggle).toHaveBeenCalled()
  expect(screen.queryByTestId('expanded')).not.toBeInTheDocument()
})
