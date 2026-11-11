jest.mock('@/hooks/useAchievementPins', () => ({ ...jest.requireActual('@/hooks/useAchievementPins'), useAchievementPins: jest.fn() }))

import { render, screen, fireEvent, within } from '@testing-library/react'
import SteamGameInfoTable from './SteamGameInfoTable'
import { useAchievementPins, STEAM_PINS } from '@/hooks/useAchievementPins'
import { mockPins } from '@/test-utils/pins'
import { en } from '@/translations/en'
import type { SteamAchievementUnified } from '@/types/steam'

// What every platform's table does is in AchievementTable.contract.test.tsx; this is Steam's own.

function ach(apiname: string, overrides: Partial<SteamAchievementUnified> = {}): SteamAchievementUnified {
  return {
    _source: 'steam', id: apiname, apiname, title: apiname, description: `${apiname} desc`, earned: false, dateEarned: null,
    badgeUrl: `${apiname}.jpg`, displayOrder: 0, hidden: false, globalPct: null, likelyOnline: false, ...overrides,
  }
}

const names = () => within(screen.getByRole('table')).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

beforeEach(() => {
  ;(useAchievementPins as jest.Mock).mockReturnValue(mockPins(STEAM_PINS.idOf, { canPin: false }).value)
})

test("in Steam's order, whatever order they came in", () => {
  render(<SteamGameInfoTable achievements={[ach('B', { displayOrder: 1 }), ach('A', { displayOrder: 0 })]} appId={620} gameTitle="Portal 2" />)
  expect(names()).toEqual(['A', 'B'])
})

test('guides are searched by the English name', async () => {
  render(<SteamGameInfoTable achievements={[ach('WIN', { title: 'Victoria', titleEn: 'Win', globalPct: 12.5 })]} appId={620} gameTitle="Portal 2" />)
  fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: 'Victoria' }))
  const dialog = await screen.findByRole('dialog', { name: 'Victoria' })
  expect(within(dialog).getByRole('link', { name: en.achievementDetail.steamGuides })).toHaveAttribute(
    'href',
    'https://steamcommunity.com/app/620/guides/?searchText=Win',
  )
})

test('a secret one keeps its text but shows its picture', () => {
  render(<SteamGameInfoTable achievements={[ach('SECRET', { hidden: true })]} appId={620} gameTitle="Portal 2" />)
  expect(within(screen.getByRole('row', { name: new RegExp(en.steam.hiddenAchievement) })).getByRole('presentation')).toHaveAttribute('src', 'SECRET.jpg')
})

test('one that likely needs online play says so beside its name and in its window', async () => {
  render(<SteamGameInfoTable achievements={[ach('MP', { title: 'Win online', likelyOnline: true })]} appId={620} gameTitle="Portal 2" />)
  expect(within(screen.getByRole('table')).getByText(en.steam.likelyOnline)).toBeInTheDocument()
  fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: 'Win online' }))
  expect(within(await screen.findByRole('dialog')).getByText(en.steam.likelyOnline)).toBeInTheDocument()
})
