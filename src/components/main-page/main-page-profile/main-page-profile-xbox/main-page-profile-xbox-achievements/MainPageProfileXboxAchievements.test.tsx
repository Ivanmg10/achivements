import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfileXboxAchievements from './MainPageProfileXboxAchievements'
import { en } from '@/translations/en'
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

test('empty, loading and failed states', () => {
  const onRetry = jest.fn()
  const { rerender, container } = render(<MainPageProfileXboxAchievements achievements={[]} isLoading={false} error={null} onRetry={onRetry} />)
  expect(screen.getByText(en.cards.noEarned)).toBeInTheDocument()
  rerender(<MainPageProfileXboxAchievements achievements={[]} isLoading error={null} onRetry={onRetry} />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  rerender(<MainPageProfileXboxAchievements achievements={[]} isLoading={false} error="failed" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.achievementsError)
  fireEvent.click(screen.getByRole('button', { name: en.xbox.retry }))
  expect(onRetry).toHaveBeenCalled()
})

test('with some already in, a refresh keeps them on screen instead of a skeleton', () => {
  const { container } = render(<MainPageProfileXboxAchievements achievements={[recent(1)]} isLoading error={null} onRetry={jest.fn()} />)
  expect(screen.getAllByRole('link')).toHaveLength(1)
  expect(container.querySelector('[aria-busy="true"]')).toBeNull()
})
