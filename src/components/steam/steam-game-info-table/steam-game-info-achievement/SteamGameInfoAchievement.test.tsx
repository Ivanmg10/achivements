import { render, screen } from '@testing-library/react'
import SteamGameInfoAchievement from './SteamGameInfoAchievement'
import { en } from '@/translations/en'
import type { SteamAchievementUnified } from '@/types/steam'

function ach(overrides: Partial<SteamAchievementUnified> = {}): SteamAchievementUnified {
  return {
    _source: 'steam', id: 'WIN', apiname: 'WIN', title: 'Win a Match', description: 'Win your first match',
    earned: false, dateEarned: null, badgeUrl: 'icon.jpg', displayOrder: 0, hidden: false, globalPct: null, likelyOnline: false,
    ...overrides,
  }
}

function renderRow(a: SteamAchievementUnified, highlighted = false) {
  return render(
    <table>
      <tbody>
        <SteamGameInfoAchievement achievement={a} highlighted={highlighted} />
      </tbody>
    </table>,
  )
}

test('shows title, description and rarity', () => {
  renderRow(ach({ globalPct: 12.34 }))
  expect(screen.getByRole('heading', { name: 'Win a Match' })).toBeInTheDocument()
  expect(screen.getByText('Win your first match')).toBeInTheDocument()
  expect(screen.getByText('12.3%')).toBeInTheDocument()
})

test('shows a dash when rarity is unknown', () => {
  renderRow(ach())
  expect(screen.getByText('—')).toBeInTheDocument()
})

test('an earned achievement shows its unlock time and a coloured, ringed badge', () => {
  const { container } = renderRow(ach({ earned: true, dateEarned: '2024-01-15T12:00:00.000Z' }))
  const img = container.querySelector('img')!
  expect(img.className).toContain('ring-2')
  expect(img.className).not.toContain('grayscale')
  expect(screen.getByText(/2024/)).toBeInTheDocument()
})

test('an earned achievement with no timestamp still says earned', () => {
  renderRow(ach({ earned: true, dateEarned: null }))
  expect(screen.getByText(en.steam.earned)).toBeInTheDocument()
})

test('a locked achievement says so in text and greys its badge', () => {
  const { container } = renderRow(ach())
  expect(screen.getByText(en.steam.locked)).toBeInTheDocument()
  expect(container.querySelector('img')!.className).toContain('grayscale')
})

test('conceals a hidden achievement until it is earned', () => {
  const { rerender } = renderRow(ach({ hidden: true, title: 'Spoiler', description: 'The ending' }))
  expect(screen.queryByText('Spoiler')).not.toBeInTheDocument()
  expect(screen.getByText(en.steam.hiddenAchievement)).toBeInTheDocument()
  expect(screen.getByText(en.steam.hiddenAchievementDesc)).toBeInTheDocument()

  rerender(
    <table>
      <tbody>
        <SteamGameInfoAchievement achievement={ach({ hidden: true, title: 'Spoiler', earned: true })} />
      </tbody>
    </table>,
  )
  expect(screen.getByText('Spoiler')).toBeInTheDocument()
})

test('carries its api name for deep links and shows the highlight when asked', () => {
  const { container } = renderRow(ach(), true)
  const row = container.querySelector('tr')!
  expect(row.dataset.ach).toBe('WIN')
  expect(row.className).toContain('bg-[#66c0f4]/15')
})

test('falls back to a placeholder badge', () => {
  const { container } = renderRow(ach({ badgeUrl: '' }))
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
})

test('flags an achievement that probably needs online play, and only that', () => {
  renderRow(ach({ likelyOnline: true }))
  expect(screen.getByText(en.steam.likelyOnline)).toBeInTheDocument()
})

test('no online flag by default', () => {
  renderRow(ach())
  expect(screen.queryByText(en.steam.likelyOnline)).not.toBeInTheDocument()
})
