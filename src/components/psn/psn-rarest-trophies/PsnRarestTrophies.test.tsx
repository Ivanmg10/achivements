import { render, screen } from '@testing-library/react'
import PsnRarestTrophies from './PsnRarestTrophies'
import { en } from '@/translations/en'
import type { PsnTrophy } from '@/types/psn'

const trophy = (overrides: Partial<PsnTrophy>): PsnTrophy => ({
  id: 0, name: 'Name', detail: '', iconUrl: null, type: 'bronze', groupId: 'default',
  hidden: false, earned: true, earnedAt: '2026-01-01T00:00:00Z', rarity: 50, ...overrides,
})

test('the rarest earned first, each linking to its row', () => {
  render(
    <PsnRarestTrophies
      gameId={100}
      isLoading={false}
      trophies={[
        trophy({ id: 1, name: 'Common', rarity: 80 }),
        trophy({ id: 2, name: 'Rare', rarity: 1.5 }),
        trophy({ id: 3, name: 'Locked', rarity: 0.1, earned: false }),
        trophy({ id: 4, name: 'Unknown', rarity: null }),
      ]}
    />,
  )
  const links = screen.getAllByRole('link')
  expect(links.map((l) => l.textContent?.split(en.psn.bronze)[0])).toEqual(['Rare', 'Common'])
  expect(links[0]).toHaveAttribute('href', '/psnGame/NPWR00001_00#trophy-2')
})

test('says so when nothing is earned', () => {
  render(<PsnRarestTrophies gameId={100} isLoading={false} trophies={[trophy({ earned: false })]} />)
  expect(screen.getByText(en.psn.noneEarned)).toBeInTheDocument()
})

test('a skeleton while loading', () => {
  const { container } = render(<PsnRarestTrophies gameId={100} isLoading trophies={[]} />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})
