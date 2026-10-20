import { render, screen } from '@testing-library/react'
import XboxRarestAchievements from './XboxRarestAchievements'
import { en } from '@/translations/en'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'

test('the rarest earned first, each linking to its row', () => {
  render(
    <XboxRarestAchievements
      gameId={100}
      isLoading={false}
      achievements={[
        xboxAchievementFixture({ id: '1', name: 'Common', rarity: 80 }),
        xboxAchievementFixture({ id: '2', name: 'Rare', rarity: 1.5 }),
        xboxAchievementFixture({ id: '3', name: 'Locked', rarity: 0.1, unlocked: false }),
        xboxAchievementFixture({ id: '4', name: 'Unknown', rarity: null }),
      ]}
    />,
  )
  const links = screen.getAllByRole('link')
  expect(links.map((l) => l.textContent?.split(' G')[0].replace(/\d+$/, ''))).toEqual(['Rare', 'Common'])
  expect(links[0]).toHaveAttribute('href', '/xboxGame/100#achievement-2')
  expect(links[0]).toHaveTextContent(en.xbox.rarity.replace('{n}', '1.5'))
})

test('shows at most four', () => {
  const many = Array.from({ length: 9 }, (_, i) => xboxAchievementFixture({ id: String(i), name: `A${i}`, rarity: i + 1 }))
  render(<XboxRarestAchievements gameId={100} isLoading={false} achievements={many} />)
  expect(screen.getAllByRole('link')).toHaveLength(4)
})

test('says so when nothing is earned', () => {
  render(<XboxRarestAchievements gameId={100} isLoading={false} achievements={[xboxAchievementFixture({ unlocked: false })]} />)
  expect(screen.getByText(en.xbox.noneEarned)).toBeInTheDocument()
})

test('a skeleton while loading', () => {
  const { container } = render(<XboxRarestAchievements gameId={100} isLoading achievements={[]} />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})
