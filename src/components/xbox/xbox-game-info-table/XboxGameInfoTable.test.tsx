jest.mock('@/hooks/useXboxFavoriteAchievements', () => ({ useXboxFavoriteAchievements: jest.fn() }))

import { render, screen, fireEvent, within } from '@testing-library/react'
import XboxGameInfoTable from './XboxGameInfoTable'
import { en } from '@/translations/en'
import { useXboxFavoriteAchievements } from '@/hooks/useXboxFavoriteAchievements'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'

// What every platform's table does is in AchievementTable.contract.test.tsx; this is Xbox's own.

const ACHIEVEMENTS = [
  xboxAchievementFixture({ id: 'b', name: 'Second sent', gamerscore: 100 }),
  xboxAchievementFixture({ id: 'a', name: 'Common', gamerscore: 10 }),
]

const names = () => within(screen.getByRole('table')).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

beforeEach(() => {
  ;(useXboxFavoriteAchievements as jest.Mock).mockReturnValue({ pinned: new Set(), leading: new Set(), toggle: jest.fn(), canPin: false })
})

test('in the order Xbox sends them, each with its gamerscore', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  expect(names()).toEqual(['Second sent', 'Common'])
  expect(within(screen.getByRole('columnheader', { name: en.xbox.score })).getByText(en.xbox.score)).toBeInTheDocument()
  expect(within(screen.getAllByRole('row')[1]).getByText('100')).toBeInTheDocument()
})

test('an achievement opens with its gamerscore and guide links', async () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo Infinite" achievements={ACHIEVEMENTS} />)
  fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: 'Common' }))
  const dialog = await screen.findByRole('dialog', { name: 'Common' })
  expect(within(dialog).getByText('10 G')).toBeInTheDocument()
  expect(within(dialog).getByRole('link', { name: en.achievementDetail.trueAchievements })).toHaveAttribute(
    'href',
    'https://www.trueachievements.com/searchresults.aspx?search=Halo%20Infinite',
  )
})
