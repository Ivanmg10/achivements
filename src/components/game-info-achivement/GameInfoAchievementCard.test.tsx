import { fireEvent, render, screen } from '@testing-library/react'
import GameInfoAchievementCard from './GameInfoAchievementCard'
import { en } from '@/translations/en'
import type { RetroAchievement } from '@/types/types'

const ach = (over: Partial<RetroAchievement> = {}) =>
  ({
    ID: 1, Title: 'The Jowai Resort', Description: 'Complete Pokitaru', Points: 5, BadgeName: '123',
    NumAwarded: 50, NumAwardedHardcore: 40, DateEarned: '2026-07-29', DateEarnedHardcore: '2026-07-29', Author: 'Vancleef',
    ...over,
  }) as RetroAchievement

test('the whole card opens the achievement', () => {
  const onClick = jest.fn()
  render(<GameInfoAchievementCard achievement={ach()} numDistinctPlayers={100} onClick={onClick} />)
  fireEvent.click(screen.getByRole('button', { name: 'The Jowai Resort' }))
  expect(onClick).toHaveBeenCalled()
})

test('the favourite star is its own button, not nested in another, and does not open the card', () => {
  const onClick = jest.fn()
  const onToggleFavorite = jest.fn()
  const { container } = render(
    <GameInfoAchievementCard achievement={ach()} numDistinctPlayers={100} onClick={onClick} onToggleFavorite={onToggleFavorite} />,
  )
  expect(container.querySelector('button button')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: en.favorites.addFavorite }))
  expect(onToggleFavorite).toHaveBeenCalled()
  expect(onClick).not.toHaveBeenCalled()
})

test('the badge holds its place until it loads', () => {
  const { container } = render(<GameInfoAchievementCard achievement={ach()} numDistinctPlayers={100} />)
  expect(container.querySelector('img')!.parentElement).toHaveClass('animate-pulse', 'w-14', 'h-14')
})
