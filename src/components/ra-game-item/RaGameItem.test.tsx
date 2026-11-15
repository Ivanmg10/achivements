import { render, screen } from '@testing-library/react'
import RaGameItem from './RaGameItem'
import type { RecentlyPlayedGame } from '@/types/types'

function game(overrides: Partial<RecentlyPlayedGame> = {}): RecentlyPlayedGame {
  return {
    GameID: 42,
    Title: 'Pokémon Emerald',
    ImageIcon: '/Images/001.png',
    ConsoleName: 'Game Boy Advance',
    LastPlayed: '2024-01-15 20:30:00',
    NumPossibleAchievements: 80,
    PossibleScore: 600,
    NumAchieved: 20,
    ScoreAchieved: 150,
    NumAchievedHardcore: 20,
    ScoreAchievedHardcore: 150,
    ...overrides,
  }
}

test('shows title, console, progress and the counts', () => {
  render(<RaGameItem game={game()} expanded={false} onToggle={() => {}} />)
  expect(screen.getByText('Pokémon Emerald')).toBeInTheDocument()
  expect(screen.getByText('Game Boy Advance')).toBeInTheDocument()
  expect(screen.getByText('25%')).toBeInTheDocument()
  expect(screen.getByText('20/80 achievements')).toBeInTheDocument()
  expect(screen.getByText('150/600 pts')).toBeInTheDocument()
})







test('a mastered game reads 100%', () => {
  render(<RaGameItem game={game({ NumAchieved: 80, NumAchievedHardcore: 80 })} expanded={false} onToggle={() => {}} />)
  expect(screen.getByText('100%')).toBeInTheDocument()
})

test('a game with no achievements shows no progress', () => {
  render(<RaGameItem game={game({ NumPossibleAchievements: 0 })} expanded={false} onToggle={() => {}} />)
  expect(screen.queryByText(/%$/)).not.toBeInTheDocument()
})
