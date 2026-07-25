import { render, screen } from '@testing-library/react'
import StatusGameItem from './StatusGameItem'

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
} as any

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
} as any

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

test('hides the points line when extra data has no possibleScore', () => {
  render(<StatusGameItem game={completedGame} extra={{ awards: [] }} category="completed" />)
  expect(screen.queryByText((_, el) => el?.textContent === '150 / 200 points earned')).not.toBeInTheDocument()
})

test('renders total points only for a want-to-play game', () => {
  render(<StatusGameItem game={wantToPlayGame} category="wantToPlay" />)
  expect(screen.getByText(/450/)).toBeInTheDocument()
})

test('hides the want-to-play points line when PointsTotal is zero', () => {
  render(<StatusGameItem game={{ ...wantToPlayGame, PointsTotal: 0 }} category="wantToPlay" />)
  expect(screen.queryByText(/450/)).not.toBeInTheDocument()
})
