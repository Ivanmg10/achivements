import { render, screen } from '@testing-library/react'
import SteamGameInfoAchievementCard from './SteamGameInfoAchievementCard'
import { en } from '@/translations/en'
import type { SteamAchievementUnified } from '@/types/steam'

function ach(overrides: Partial<SteamAchievementUnified> = {}): SteamAchievementUnified {
  return {
    _source: 'steam', id: 'WIN', apiname: 'WIN', title: 'Win a Match', description: 'Win your first match',
    earned: false, dateEarned: null, badgeUrl: 'icon.jpg', displayOrder: 0, hidden: false, globalPct: null, likelyOnline: false,
    ...overrides,
  }
}

function renderCard(a: SteamAchievementUnified, highlighted = false) {
  return render(
    <ul>
      <SteamGameInfoAchievementCard achievement={a} highlighted={highlighted} />
    </ul>,
  )
}

test('shows title, description and rarity phrased as a share of players', () => {
  renderCard(ach({ globalPct: 0.054 }))
  expect(screen.getByRole('heading', { name: 'Win a Match' })).toBeInTheDocument()
  expect(screen.getByText(`0.05${en.achievement.haveIt}`)).toBeInTheDocument()
})

test('omits rarity when unknown', () => {
  renderCard(ach())
  expect(screen.queryByText(en.achievement.haveIt, { exact: false })).not.toBeInTheDocument()
})

test('earned vs locked is in text, not only the badge', () => {
  const { container, rerender } = renderCard(ach({ earned: true, dateEarned: '2024-01-15T12:00:00.000Z' }))
  expect(screen.getByText(/2024/)).toBeInTheDocument()
  expect(container.querySelector('img')!.className).toContain('ring-2')

  rerender(<ul><SteamGameInfoAchievementCard achievement={ach()} /></ul>)
  expect(screen.getByText(en.steam.locked)).toBeInTheDocument()
  expect(container.querySelector('img')!.className).toContain('grayscale')
})

test('an undated unlock still says earned', () => {
  renderCard(ach({ earned: true }))
  expect(screen.getByText(en.steam.earned)).toBeInTheDocument()
})

test('conceals a hidden achievement until earned', () => {
  renderCard(ach({ hidden: true, title: 'Spoiler' }))
  expect(screen.queryByText('Spoiler')).not.toBeInTheDocument()
  expect(screen.getByText(en.steam.hiddenAchievement)).toBeInTheDocument()
})

test('carries its api name and the highlight', () => {
  renderCard(ach(), true)
  const li = screen.getByRole('listitem')
  expect(li.dataset.ach).toBe('WIN')
  expect(li.className).toContain('bg-[#66c0f4]/15')
})

test('falls back to a placeholder badge', () => {
  const { container } = renderCard(ach({ badgeUrl: '' }))
  expect(container.querySelector('img')).toBeNull()
})

test('flags an achievement that probably needs online play', () => {
  renderCard(ach({ likelyOnline: true }))
  expect(screen.getByText(en.steam.likelyOnline)).toBeInTheDocument()
})
