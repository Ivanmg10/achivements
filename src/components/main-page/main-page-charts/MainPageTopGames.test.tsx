import { render, screen } from '@testing-library/react'
import MainPageTopGames from './MainPageTopGames'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

function today() {
  return new Date().toISOString().split('T')[0] + ' 12:00:00'
}

function ra(title: string, over: Partial<RecentAchievement> = {}): RecentAchievement {
  return {
    Date: today(), HardcoreMode: '1', AchievementID: Math.random(), Title: 'a', Description: '', BadgeName: '1',
    Points: 5, GameID: 1, GameTitle: title, GameIcon: '/Images/1.png', ConsoleName: 'SNES', ...over,
  }
}

test('shows a skeleton while loading', () => {
  render(<MainPageTopGames achievements={[]} isLoading />)
  expect(screen.queryByText(en.cards.mostActiveGames)).not.toBeInTheDocument()
})

test('shows the empty state without recent unlocks', () => {
  render(<MainPageTopGames achievements={[]} />)
  expect(screen.getByText(en.cards.noData)).toBeInTheDocument()
})

test('ranks the games with the most unlocks this month, linking RA games to their page', () => {
  render(<MainPageTopGames achievements={[ra('Zelda'), ra('Mario', { GameID: 2 }), ra('Mario', { GameID: 2 })]} />)
  const links = screen.getAllByRole('link')
  expect(links.map((l) => l.textContent)).toEqual([expect.stringContaining('Mario'), expect.stringContaining('Zelda')])
  expect(links[0].getAttribute('href')).toBe('/gameInfo/2')
  expect(links[1].querySelector('img')?.getAttribute('src')).toBe('https://retroachievements.org/Images/1.png')
})

test('links Steam games to the Steam page, with their full image URL', () => {
  render(
    <MainPageTopGames
      achievements={[ra('Portal 2', { GameID: 620, GameIcon: undefined, Source: 'steam', GameIconUrl: 'https://cdn/h.jpg', ConsoleName: 'Steam' })]}
    />,
  )
  const link = screen.getByRole('link')
  expect(link.getAttribute('href')).toBe('/steamGame/620')
  expect(link.querySelector('img')?.getAttribute('src')).toBe('https://cdn/h.jpg')
})

test('ignores unlocks older than 30 days', () => {
  render(<MainPageTopGames achievements={[ra('Old', { Date: '2000-01-01 00:00:00' })]} />)
  expect(screen.getByText(en.cards.noData)).toBeInTheDocument()
})
