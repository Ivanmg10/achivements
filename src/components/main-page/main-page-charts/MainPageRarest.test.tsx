import { render, screen } from '@testing-library/react'
import MainPageRarest from './MainPageRarest'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'
import type { SteamRecentAchievement } from '@/types/steam'

function ra(id: number, trueRatio: number, points = 5): RecentAchievement {
  return {
    Date: '2024-01-15 12:00:00', HardcoreMode: '1', AchievementID: id, Title: `RA ${id}`, Description: '', BadgeName: `${id}`,
    Points: points, TrueRatio: trueRatio, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES',
  }
}

function steam(apiname: string, globalPct: number | null): SteamRecentAchievement {
  return { appId: 620, gameTitle: 'Portal 2', apiname, title: `Steam ${apiname}`, badgeUrl: '', unlockedAt: '2024-01-15T10:00:00.000Z', globalPct }
}

function titles() {
  return screen.getAllByRole('link').map((l) => l.textContent)
}

test('alternates each platform’s rarest, each with its own measure', () => {
  render(<MainPageRarest achievements={[ra(1, 20), ra(2, 90)]} steamAchievements={[steam('A', 40), steam('B', 0.5)]} />)
  expect(titles()).toEqual([
    expect.stringContaining('RA 2'),
    expect.stringContaining('Steam B'),
    expect.stringContaining('RA 1'),
    expect.stringContaining('Steam A'),
  ])
  expect(screen.getByText('90')).toBeInTheDocument()
  expect(screen.getByText('0.5%')).toBeInTheDocument()
  expect(screen.getAllByRole('link')[1].getAttribute('href')).toBe('/steamGame/620#ach-B')
})

test('fills the list from one platform when the other has few, up to six', () => {
  render(<MainPageRarest achievements={[ra(1, 20)]} steamAchievements={['A', 'B', 'C', 'D', 'E', 'F'].map((n, i) => steam(n, i + 1))} />)
  expect(screen.getAllByRole('link')).toHaveLength(6)
})

test('RA only: leaves out unlocks whose TrueRatio adds nothing', () => {
  render(<MainPageRarest achievements={[ra(1, 5, 5), ra(2, 30)]} />)
  expect(titles()).toEqual([expect.stringContaining('RA 2')])
})

test('says so when nothing has rarity, and shows a skeleton while loading', () => {
  const { rerender } = render(<MainPageRarest achievements={[]} steamAchievements={[steam('A', null)]} />)
  expect(screen.getByText(en.cards.noRarityData)).toBeInTheDocument()
  rerender(<MainPageRarest achievements={[]} isLoading />)
  expect(screen.queryByText(en.cards.rarestUnlocks)).not.toBeInTheDocument()
})
