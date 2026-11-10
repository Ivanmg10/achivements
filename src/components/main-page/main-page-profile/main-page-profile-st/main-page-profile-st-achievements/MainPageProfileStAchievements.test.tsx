import { render, screen } from '@testing-library/react'
import MainPageProfileStAchievements from './MainPageProfileStAchievements'
import { en } from '@/translations/en'
import type { SteamRecentAchievement } from '@/types/steam'

function ach(i: number, overrides: Partial<SteamRecentAchievement> = {}): SteamRecentAchievement {
  return {
    appId: 377160,
    gameTitle: 'Fallout 4',
    apiname: `A${i}`,
    title: `Achievement ${i}`,
    badgeUrl: `a${i}.jpg`,
    unlockedAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  }
}

const retry = jest.fn()

function renderIt(props: Partial<React.ComponentProps<typeof MainPageProfileStAchievements>> = {}) {
  return render(
    <MainPageProfileStAchievements achievements={[ach(1)]} isLoading={false} error={null} onRetry={retry} {...props} />,
  )
}

beforeEach(() => jest.clearAllMocks())

test('is headed like the RA list', () => {
  renderIt()
  expect(screen.getByText(en.profileAchievements.recentAchievements)).toBeInTheDocument()
})

test('shows badge, title, game and unlock date, linking to the achievement', () => {
  const { container } = renderIt()
  expect(screen.getByText('Achievement 1')).toBeInTheDocument()
  expect(screen.getByText(/Fallout 4/)).toBeInTheDocument()
  expect(container.querySelector('img')?.getAttribute('src')).toBe('a1.jpg')

  const time = container.querySelector('time')!
  expect(time.getAttribute('dateTime')).toBe('2026-09-13T12:00:00.000Z')
  expect(time.textContent).toMatch(/13/)

  expect(screen.getByRole('link').getAttribute('href')).toBe('/steamGame/377160#ach-A1')
})

test('falls back to a placeholder badge', () => {
  const { container } = renderIt({ achievements: [ach(1, { badgeUrl: '' })] })
  expect(container.querySelector('img')).toBeNull()
})
