jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: undefined, isDragging: false }),
}))
jest.mock('@/components/psn/psn-recently-played-expanded/PsnRecentlyPlayedExpanded', () => ({
  __esModule: true,
  default: () => <div data-testid="expanded" />,
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnPinnedGameRow from './PsnPinnedGameRow'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { en } from '@/translations/en'

const GAME = {
  _source: 'psn', id: 100, titleId: 'NPWR00001_00', title: 'Astro Bot', imageIcon: 'https://a.png',
  consoleName: 'PS5', maxPossible: 10, numAwarded: 4, pctWon: 40,
}

function setLibrary(library: unknown[], libraryLoading = false) {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ library, libraryLoading })
}

test('a pinned game with its progress, opening its dashboard', () => {
  setLibrary([GAME])
  const onToggle = jest.fn()
  const { rerender } = render(<PsnPinnedGameRow gameId={100} isOpen={false} onToggle={onToggle} />)
  expect(screen.getByRole('link', { name: 'Astro Bot' })).toHaveAttribute('href', '/psnGame/NPWR00001_00')
  expect(screen.getByRole('button', { name: en.cards.dragToReorder })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: `${en.psn.showTrophies}: Astro Bot` }))
  expect(onToggle).toHaveBeenCalled()
  rerender(<PsnPinnedGameRow gameId={100} isOpen onToggle={onToggle} />)
  expect(screen.getByTestId('expanded')).toBeInTheDocument()
})

test('a placeholder while the list loads', () => {
  setLibrary([], true)
  const { container } = render(<PsnPinnedGameRow gameId={100} isOpen={false} onToggle={jest.fn()} />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
})

test('a pin for a game no longer in the list can still be unpinned', () => {
  setLibrary([])
  render(<PsnPinnedGameRow gameId={100} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByTestId('pin')).toBeInTheDocument()
})
