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

test('live numbers from the Xbox library, linking to the Xbox page', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({
    fullLibrary: [xboxGameFixture({ id: 1738914043, title: 'Halo', consoleName: 'Xbox Series', numAwarded: 8, maxPossible: 10, totalKnown: true, pctWon: 75, earnedGamerscore: 300, totalGamerscore: 400, lastPlayed: '2026-01-02T00:00:00Z' })],
  })
  render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByRole('link', { name: 'Halo' })).toHaveAttribute('href', '/xboxGame/1738914043')
  expect(screen.getByText('Xbox Series')).toBeInTheDocument()
  expect(screen.getByText('8 / 10 achievements')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Halo' })).toHaveAttribute('aria-valuenow', '75')
  expect(screen.getByText('300')).toBeInTheDocument()
})

test('the stored counts when the library does not have it', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [] })
  render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable={false} />)
  expect(screen.getByText('2 / 10 achievements')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: en.cards.dragToReorder })).not.toBeInTheDocument()
})

test('a game whose count Xbox does not say is written with what is earned', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [xboxGameFixture({ id: 1738914043, numAwarded: 15, maxPossible: 0, totalKnown: false, pctWon: 14 })] })
  render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText('15 achievements')).toBeInTheDocument()
})

test('removes and expands to its achievements', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [] })
  const onRemove = jest.fn()
  render(<XboxSortableItem item={ITEM} onRemove={onRemove} draggable />)
  fireEvent.click(screen.getByRole('button', { name: `${en.groups.removeGame}: Halo` }))
  expect(onRemove).toHaveBeenCalledWith(7)
  fireEvent.click(screen.getByRole('button', { name: `${en.xbox.showAchievements}: Halo` }))
  expect(screen.getByTestId('achievements')).toHaveTextContent('1738914043')
})

test('a finished game is marked', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [xboxGameFixture({ id: 1738914043, pctWon: 100 })] })
  const { container } = render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(container.textContent).toContain(`★ ${en.steam.perfect}`)
})

const MINUTES = 3409
const PLAYED = formatPlaytime(MINUTES, { minutes: en.steam.minutesShort, hours: en.steam.hoursShort }, 'en')

test('the play time next to when it was last played', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [xboxGameFixture({ id: 1738914043, playtimeMinutes: MINUTES })] })
  render(<XboxSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText(new RegExp(`${en.steam.playtime} ${PLAYED}`))).toBeInTheDocument()
})
