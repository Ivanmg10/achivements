import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import StatusGameItem from './StatusGameItem'
import type { CategoryGame } from '@/hooks/useGamesByCategory'

const completedGame = {
  GameID: 1,
  ID: '1',
  Title: 'Sly Cooper',
  GameTitle: 'Sly Cooper',
  ConsoleID: 21,
  ConsoleName: 'PS2',
  ImageIcon: '/icon.png',
  MaxPossible: 10,
  NumAwarded: 10,
  PctWon: '1.0',
  HardcoreMode: '0',
} as unknown as CategoryGame

const wantToPlayGame = {
  GameID: 2,
  ID: 2,
  Title: 'Jak 2',
  GameTitle: 'Jak 2',
  ConsoleID: 21,
  ConsoleName: 'PS2',
  ImageIcon: '/icon2.png',
  AchievementsPublished: 30,
  PointsTotal: 450,
} as unknown as CategoryGame

test('renders earned/total points for a playing/completed game when extra data is present', () => {
  render(
    <StatusGameItem
      game={completedGame}
      extra={{ awards: [], possibleScore: 200, scoreAchieved: 150, scoreAchievedHardcore: 0 }}
      category="completed"
    />,
  )
  expect(screen.getByText(/150 \/ 200/)).toBeInTheDocument()
})

test('prefers hardcore score over softcore score when both are present', () => {
  render(
    <StatusGameItem
      game={completedGame}
      extra={{ awards: [], possibleScore: 200, scoreAchieved: 150, scoreAchievedHardcore: 200 }}
      category="completed"
    />,
  )
  expect(screen.getByText(/200 \/ 200/)).toBeInTheDocument()
})

test('without a possible score there is no points line, not a stray dash', () => {
  render(<StatusGameItem game={completedGame} extra={{ awards: [] }} category="completed" />)
  expect(screen.queryByText(/points earned/)).not.toBeInTheDocument()
  expect(screen.queryByText('—')).not.toBeInTheDocument()
})

test('renders total points only for a want-to-play game', () => {
  render(<StatusGameItem game={wantToPlayGame} category="wantToPlay" />)
  expect(screen.getByText(/450/)).toBeInTheDocument()
})

test('hides the want-to-play points line when PointsTotal is zero', () => {
  render(<StatusGameItem game={{ ...wantToPlayGame, PointsTotal: 0 }} category="wantToPlay" />)
  expect(screen.queryByText(/450/)).not.toBeInTheDocument()
})

test('the achievements open from a real button that says whether it is open', () => {
  render(<StatusGameItem game={completedGame} extra={{ awards: [] }} category="completed" />)
  const toggle = screen.getByRole('button', { expanded: false })
  expect(toggle).toHaveAccessibleName(/Sly Cooper/)
  fireEvent.click(toggle)
  expect(screen.getByRole('button', { expanded: true })).toBe(toggle)
})

test('the cover is not a second tab stop to the same page', () => {
  render(<StatusGameItem game={completedGame} extra={{ awards: [] }} category="completed" />)
  expect(screen.getAllByRole('link', { name: 'Sly Cooper' })).toHaveLength(1)
})

test('awards and the last-played line come from the translations', () => {
  render(
    <StatusGameItem
      game={completedGame}
      extra={{ awards: [{ AwardType: 'Mastery/Completion', AwardDataExtra: 1, AwardedAt: '2026-01-01T00:00:00Z' } as never] }}
      category="playing"
    />,
  )
  expect(screen.getByText(en.statusGameItem.mastered, { exact: false })).toBeInTheDocument()
  expect(screen.getByText(new RegExp(en.statusGameItem.longAgo))).toBeInTheDocument()
})
