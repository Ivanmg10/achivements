import { render, screen } from '@testing-library/react'
import MainPageProfileXboxAchievements from './MainPageProfileXboxAchievements'
import { xboxRecentFixture } from '@/test-utils/xboxFixtures'

const recent = (n: number) => xboxRecentFixture({ achievementId: String(n), name: `Achievement ${n}`, gamerscore: n * 10 })

test('the latest three, each linking to its achievement on the game page, with its gamerscore', () => {
  render(<MainPageProfileXboxAchievements achievements={[recent(1), recent(2), recent(3), recent(4)]} isLoading={false} error={null} onRetry={jest.fn()} />)
  const links = screen.getAllByRole('link')
  expect(links).toHaveLength(3)
  expect(links[0]).toHaveAttribute('href', '/xboxGame/1738914043#achievement-1')
  expect(links[0]).toHaveTextContent('10 G')
  expect(links[0]).toHaveTextContent('Modern Game')
})
