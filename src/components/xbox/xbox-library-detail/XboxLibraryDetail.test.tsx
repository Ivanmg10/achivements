jest.mock('@/hooks/useXboxAchievements', () => ({ useXboxAchievements: jest.fn() }))
jest.mock('@/components/library-game-detail/LibraryGameDetail', () => ({
  __esModule: true,
  default: ({ facts, ring, state, info }: { facts: { label: string; value: string }[]; ring: { earned: number; total: number }; state: string; info: { value: string }[] }) => (
    <div data-testid="detail" data-state={state} data-ring={`${ring.earned}/${ring.total}`}>
      {info.map((i) => i.value).join(',')}|{facts.map((f) => `${f.label}:${f.value}`).join(',')}
    </div>
  ),
}))

import { render, screen } from '@testing-library/react'
import XboxLibraryDetail from './XboxLibraryDetail'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { xboxAchievementFixture, xboxGameFixture } from '@/test-utils/xboxFixtures'
import { formatPlaytime } from '@/utils/steamFeed'
import { en } from '@/translations/en'

const GAME = xboxGameFixture({ consoleName: 'Xbox Series', maxPossible: 10, numAwarded: 4, totalKnown: true })

function setup(achievements: unknown[] = [], extra: { isLoading?: boolean; error?: string | null } = {}) {
  ;(useXboxAchievements as jest.Mock).mockReturnValue({ achievements, isLoading: false, error: null, retry: jest.fn(), ...extra })
}

test('the console and, until the achievements load, the counts the list already has', () => {
  setup([], { isLoading: true })
  render(<XboxLibraryDetail game={GAME} category="playing" />)
  expect(screen.getByTestId('detail')).toHaveAttribute('data-ring', '4/10')
  expect(screen.getByTestId('detail')).toHaveAttribute('data-state', 'loading')
  expect(screen.getByTestId('detail')).toHaveTextContent('Xbox Series')
})

test('loaded, the ring counts the achievements; a failure is its own state', () => {
  setup([xboxAchievementFixture({ id: '1' }), xboxAchievementFixture({ id: '2', unlocked: false, unlockedAt: null })])
  const { unmount } = render(<XboxLibraryDetail game={GAME} />)
  expect(screen.getByTestId('detail')).toHaveAttribute('data-ring', '1/2')
  expect(screen.getByTestId('detail')).toHaveAttribute('data-state', 'ready')
  unmount()
  setup([], { error: 'failed' })
  render(<XboxLibraryDetail game={GAME} />)
  expect(screen.getByTestId('detail')).toHaveAttribute('data-state', 'error')
})

test('the play time is a fact when Xbox gave it, and nothing otherwise', () => {
  setup()
  const { unmount } = render(<XboxLibraryDetail game={{ ...GAME, playtimeMinutes: 3409 }} />)
  const played = formatPlaytime(3409, { minutes: en.steam.minutesShort, hours: en.steam.hoursShort }, 'en')
  expect(screen.getByTestId('detail')).toHaveTextContent(`${en.steam.playtime}:${played}`)
  unmount()
  render(<XboxLibraryDetail game={GAME} />)
  expect(screen.getByTestId('detail')).not.toHaveTextContent(en.steam.playtime)
})
