jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: undefined, isDragging: false }),
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))

import { render, screen } from '@testing-library/react'
import XboxPinnedGameRow from './XboxPinnedGameRow'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

// What every platform's row does is in PinnedGameCard.contract.test.tsx; this is Xbox's own.
const GAME = xboxGameFixture({ id: 100, titleId: '100', title: 'Halo', consoleName: 'Xbox Series', maxPossible: 10, numAwarded: 4, totalKnown: true, pctWon: 40 })

function setLibrary(library: unknown[]) {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: library, libraryLoading: false })
}

test('a game whose total Xbox does not say shows only what is earned', () => {
  setLibrary([{ ...GAME, totalKnown: false, maxPossible: 0 }])
  render(<XboxPinnedGameRow gameId={100} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByText('4 achievements')).toBeInTheDocument()
})
