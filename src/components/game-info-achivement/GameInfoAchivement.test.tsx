import { render, screen } from '@testing-library/react'
import GameInfoAchivement from './GameInfoAchivement'

const mockAchievement = {
  ID: 1,
  Title: 'First Blood',
  Description: 'Kill an enemy',
  BadgeName: 'badge123',
  Points: 10,
  TrueRatio: 15,
  NumAwarded: 500,
  NumAwardedHardcore: 100,
  DateEarned: '2024-01-15 10:00:00',
  DateEarnedHardcore: null,
  Author: 'Author1',
  AuthorULID: 'ulid',
  DateModified: '2023-01-01',
  DateCreated: '2022-01-01',
  DisplayOrder: 1,
  MemAddr: '0x0000',
  Type: null,
}

const wrap = (ui: React.ReactElement) => (
  <table>
    <tbody>{ui}</tbody>
  </table>
)

test('renders achievement title and description', () => {
  render(wrap(<GameInfoAchivement achievement={mockAchievement} numDistinctPlayers={1000} />))
  expect(screen.getByText('First Blood')).toBeInTheDocument()
  expect(screen.getByText('Kill an enemy')).toBeInTheDocument()
})

test('renders points value and pts label', () => {
  render(wrap(<GameInfoAchivement achievement={mockAchievement} numDistinctPlayers={1000} />))
  expect(screen.getByText('10')).toBeInTheDocument()
  expect(screen.getByText('pts')).toBeInTheDocument()
})

test('renders em dash when achievement not earned', () => {
  render(wrap(<GameInfoAchivement achievement={{ ...mockAchievement, DateEarned: null }} numDistinctPlayers={1000} />))
  expect(screen.getByText('—')).toBeInTheDocument()
})

test('renders checkmark when achievement earned', () => {
  render(wrap(<GameInfoAchivement achievement={mockAchievement} numDistinctPlayers={1000} />))
  expect(screen.getByText('✓')).toBeInTheDocument()
})

test('renders nothing when no achievement', () => {
  const { container } = render(wrap(<GameInfoAchivement numDistinctPlayers={1000} />))
  expect(container.querySelector('tr')).toBeNull()
})

test('the title is a real button that opens the achievement, reachable by keyboard', () => {
  const onClick = jest.fn()
  render(wrap(<GameInfoAchivement achievement={mockAchievement as never} numDistinctPlayers={1000} onClick={onClick} />))
  const open = screen.getByRole('button', { name: 'First Blood' })
  open.focus()
  expect(open).toHaveFocus()
  open.click()
  expect(onClick).toHaveBeenCalledTimes(1)
})

test('the favourite star toggles without opening the achievement and reports its state', () => {
  const onClick = jest.fn()
  const onToggleFavorite = jest.fn()
  render(wrap(<GameInfoAchivement achievement={mockAchievement as never} numDistinctPlayers={1000} onClick={onClick} onToggleFavorite={onToggleFavorite} isFavorited />))
  const star = screen.getByRole('button', { pressed: true })
  star.click()
  expect(onToggleFavorite).toHaveBeenCalledTimes(1)
  expect(onClick).not.toHaveBeenCalled()
})
