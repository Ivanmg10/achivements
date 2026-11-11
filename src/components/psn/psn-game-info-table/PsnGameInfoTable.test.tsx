jest.mock('@/hooks/useAchievementPins', () => ({ ...jest.requireActual('@/hooks/useAchievementPins'), useAchievementPins: jest.fn() }))

import { render, screen, fireEvent, within } from '@testing-library/react'
import PsnGameInfoTable from './PsnGameInfoTable'
import { en } from '@/translations/en'
import { useAchievementPins, PSN_PINS } from '@/hooks/useAchievementPins'
import { mockPins } from '@/test-utils/pins'
import type { PsnTrophy } from '@/types/psn'

// What every platform's table does is in AchievementTable.contract.test.tsx; this is PSN's own.

const trophy = (overrides: Partial<PsnTrophy>): PsnTrophy => ({
  id: 0, name: 'Name', detail: 'Detail', iconUrl: 'https://i.png', type: 'bronze', groupId: 'default',
  hidden: false, earned: false, earnedAt: null, rarity: null, ...overrides,
})

const counts = (bronze: number) => ({ bronze, silver: 0, gold: 0, platinum: 0 })
const GROUPS = [
  { id: 'default', name: 'Base', iconUrl: null, defined: counts(1), earned: counts(1), progress: 100 },
  { id: '001', name: 'Winter Wonder', iconUrl: null, defined: counts(1), earned: counts(0), progress: 0 },
]
const WITH_DLC = [trophy({ id: 0, name: 'Base one', type: 'gold' }), trophy({ id: 1, name: 'DLC one', groupId: '001' })]

const names = () => within(screen.getByRole('table')).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

beforeEach(() => {
  ;(useAchievementPins as jest.Mock).mockReturnValue(mockPins(PSN_PINS.idOf, { canPin: false }).value)
})

test('in the order of the trophy ids, whatever order Sony sent them in, each with its grade', () => {
  render(<PsnGameInfoTable gameId={100} gameTitle="Astro Bot" trophies={[...WITH_DLC].reverse()} />)
  expect(names()).toEqual(['Base one', 'DLC one'])
  expect(within(screen.getByRole('table')).getByText(en.psn.gold)).toBeInTheDocument()
})

test('with DLC, tabs pick a group; without, no tabs', () => {
  const { unmount } = render(<PsnGameInfoTable gameId={100} gameTitle="Astro Bot" trophies={WITH_DLC} groups={GROUPS} />)
  fireEvent.click(screen.getByRole('tab', { name: /Winter Wonder/ }))
  expect(names()).toEqual(['DLC one'])
  fireEvent.click(screen.getByRole('tab', { name: new RegExp(en.psn.baseGame) }))
  expect(names()).toEqual(['Base one'])
  unmount()
  render(<PsnGameInfoTable gameId={100} gameTitle="Astro Bot" trophies={WITH_DLC} groups={[GROUPS[0]]} />)
  expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
})

test('a trophy opens with its grade, its DLC and guide links', async () => {
  render(<PsnGameInfoTable gameId={100} gameTitle="Bloodborne" trophies={WITH_DLC} groups={GROUPS} />)
  fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: 'DLC one' }))
  const dialog = await screen.findByRole('dialog', { name: 'DLC one' })
  expect(within(dialog).getByText(en.psn.bronze)).toBeInTheDocument()
  expect(within(dialog).getByText('DLC · Winter Wonder')).toBeInTheDocument()
  expect(within(dialog).getByRole('link', { name: en.achievementDetail.psnProfiles })).toHaveAttribute('href', 'https://psnprofiles.com/search/games?q=Bloodborne')
  expect(within(dialog).getByRole('link', { name: en.achievementDetail.youtube }).getAttribute('href')).toContain('DLC%20one')
})
