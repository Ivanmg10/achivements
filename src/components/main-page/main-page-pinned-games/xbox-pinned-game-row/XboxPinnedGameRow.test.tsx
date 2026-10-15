jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: undefined, isDragging: false }),
}))
jest.mock('@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded', () => ({
  __esModule: true,
  default: () => <div data-testid="expanded" />,
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxPinnedGameRow from './XboxPinnedGameRow'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const GAME = xboxGameFixture({ id: 100, titleId: '100', title: 'Halo', consoleName: 'Xbox Series', maxPossible: 10, numAwarded: 4, totalKnown: true, pctWon: 40 })

function setLibrary(library: unknown[], libraryLoading = false) {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ library, libraryLoading })
}

test('a pinned game with its progress, opening its dashboard', () => {
  setLibrary([GAME])
  const onToggle = jest.fn()
  const { rerender } = render(<XboxPinnedGameRow gameId={100} isOpen={false} onToggle={onToggle} />)
  expect(screen.getByRole('link', { name: 'Halo' })).toHaveAttribute('href', '/xboxGame/100')
  expect(screen.getByRole('button', { name: en.cards.dragToReorder })).toBeInTheDocument()
  expect(screen.getByText('4/10 achievements')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: `${en.xbox.showAchievements}: Halo` }))
  expect(onToggle).toHaveBeenCalled()
  rerender(<XboxPinnedGameRow gameId={100} isOpen onToggle={onToggle} />)
  expect(screen.getByTestId('expanded')).toBeInTheDocument()
})

test('a game whose total Xbox does not say shows only what is earned', () => {
  setLibrary([{ ...GAME, totalKnown: false, maxPossible: 0 }])
  render(<XboxPinnedGameRow gameId={100} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByText('4 achievements')).toBeInTheDocument()
})

test('a placeholder while the library loads', () => {
  setLibrary([], true)
  const { container } = render(<XboxPinnedGameRow gameId={100} isOpen={false} onToggle={jest.fn()} />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
})

test('a pin for a game no longer in the library can still be unpinned', () => {
  setLibrary([])
  render(<XboxPinnedGameRow gameId={100} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByTestId('pin')).toBeInTheDocument()
})
