import { render, screen } from '@testing-library/react'
import SteamRarestAchievements from './SteamRarestAchievements'
import { en } from '@/translations/en'
import type { SteamAchievementUnified } from '@/types/steam'

function ach(apiname: string, overrides: Partial<SteamAchievementUnified> = {}): SteamAchievementUnified {
  return {
    _source: 'steam', id: apiname, apiname, title: apiname, description: '', earned: true, dateEarned: null,
    badgeUrl: `${apiname}.jpg`, displayOrder: 0, hidden: false, globalPct: 50,
    ...overrides,
  }
}

test('lists earned achievements rarest first, capped at five', () => {
  const list = [
    ach('COMMON', { globalPct: 80 }),
    ach('RARE', { globalPct: 0.5 }),
    ach('MID', { globalPct: 20 }),
    ach('LOCKED', { globalPct: 0.1, earned: false }),
    ach('NO_RARITY', { globalPct: null }),
    ach('A', { globalPct: 30 }),
    ach('B', { globalPct: 40 }),
    ach('C', { globalPct: 60 }),
  ]
  render(<SteamRarestAchievements appId={620} achievements={list} isLoading={false} />)

  const titles = screen.getAllByRole('listitem').map((li) => li.textContent)
  expect(titles).toHaveLength(5)
  expect(titles[0]).toContain('RARE')
  expect(titles[0]).toContain(`0.50${en.achievement.haveIt}`)
  // Locked ones and ones without rarity are not "your rarest".
  expect(titles.join()).not.toContain('LOCKED')
  expect(titles.join()).not.toContain('NO_RARITY')
  // The five rarest of the six eligible: the most common one drops off.
  expect(titles.join()).not.toContain('COMMON')
})

test('each links to that achievement on the game page', () => {
  render(<SteamRarestAchievements appId={620} achievements={[ach('RARE', { globalPct: 1 })]} isLoading={false} />)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/steamGame/620#ach-RARE')
})

test('is headed like the RA side panel it replaces', () => {
  render(<SteamRarestAchievements appId={620} achievements={[]} isLoading={false} />)
  expect(screen.getByText(en.steam.rarestUnlocked)).toBeInTheDocument()
})

test('says so when nothing is unlocked yet', () => {
  render(<SteamRarestAchievements appId={620} achievements={[ach('X', { earned: false })]} isLoading={false} />)
  expect(screen.getByText(en.steam.noneUnlocked)).toBeInTheDocument()
})

test('shows a busy skeleton while loading', () => {
  const { container } = render(<SteamRarestAchievements appId={620} achievements={[]} isLoading />)
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
})

test('falls back to a placeholder badge', () => {
  const { container } = render(
    <SteamRarestAchievements appId={620} achievements={[ach('X', { badgeUrl: '' })]} isLoading={false} />,
  )
  expect(container.querySelector('img')).toBeNull()
})
