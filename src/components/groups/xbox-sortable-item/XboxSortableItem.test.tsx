jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: undefined, isDragging: false }),
}))
jest.mock('@/components/xbox/xbox-game-item-achievements/XboxGameItemAchievements', () => ({
  __esModule: true,
  default: ({ titleId }: { titleId: string }) => <div data-testid="achievements">{titleId}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxSortableItem from './XboxSortableItem'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import type { GameGroupItem } from '@/types/types'
import { formatPlaytime } from '@/utils/steamFeed'

const ITEM: GameGroupItem = {
  id: 7, source: 'xbox', game_id: 1738914043, title: 'Halo', image_icon: 'https://x/a.png', console_name: 'Xbox',
  pct_won: '0.2', num_awarded: 2, max_possible: 10, points_won: 0, max_points: 0, position: 0, added_at: '2026-01-01',
}

function setLibrary(...games: ReturnType<typeof xboxGameFixture>[]) {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: games })
}

test('live numbers, console and gamerscore from the Xbox library', () => {
  setLibrary(xboxGameFixture({ id: 1738914043, title: 'Halo', consoleName: 'Xbox Series', numAwarded: 8, maxPossible: 10, totalKnown: true, pctWon: 75, earnedGamerscore: 300, totalGamerscore: 400 }))
  render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText('Xbox Series')).toBeInTheDocument()
  expect(screen.getByText('8 / 10 achievements')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Halo' })).toHaveAttribute('aria-valuenow', '75')
  expect(screen.getByText('300')).toBeInTheDocument()
})

test('a game whose count Xbox does not say is written with what is earned', () => {
  setLibrary(xboxGameFixture({ id: 1738914043, numAwarded: 15, maxPossible: 0, totalKnown: false, pctWon: 14 }))
  render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText('15 achievements')).toBeInTheDocument()
})

test('with no count and no progress there is no bar', () => {
  setLibrary(xboxGameFixture({ id: 1738914043, numAwarded: 0, maxPossible: 0, totalKnown: false, pctWon: 0 }))
  render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('the play time sits next to when it was last played', () => {
  setLibrary(xboxGameFixture({ id: 1738914043, playtimeMinutes: 3409 }))
  render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText(new RegExp(`${en.steam.playtime} ${formatPlaytime(3409, en.steam, 'en')}`))).toBeInTheDocument()
})

test('opens into its achievements', () => {
  setLibrary()
  render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  fireEvent.click(screen.getByRole('button', { name: `${en.xbox.showAchievements}: Halo` }))
  expect(screen.getByTestId('achievements')).toHaveTextContent('1738914043')
})
