jest.mock('@/hooks/useXboxAchievements', () => ({ useXboxAchievements: jest.fn() }))
jest.mock('@/hooks/useXboxGameDetails', () => ({ useXboxGameDetails: jest.fn(() => ({ details: null, isLoading: false })) }))
jest.mock('@/components/library-game-detail/LibraryGameDetail', () => ({
  __esModule: true,
  default: ({ facts, ring, state, info, grid }: { facts: { label: string; value: string }[]; ring: { earned: number; total: number }; state: string; info: { value: string }[]; grid: React.ReactNode }) => (
    <div data-testid="detail" data-state={state} data-ring={`${ring.earned}/${ring.total}`}>
      {info.map((i) => i.value).join(',')}|{facts.map((f) => `${f.label}:${f.value}`).join(',')}
      <div data-testid="grid">{grid}</div>
    </div>
  ),
}))

import { render, screen } from '@testing-library/react'
import XboxLibraryDetail from './XboxLibraryDetail'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { useXboxGameDetails } from '@/hooks/useXboxGameDetails'
import { xboxAchievementFixture, xboxGameFixture } from '@/test-utils/xboxFixtures'
import { formatPlaytime } from '@/utils/steamFeed'
import { en } from '@/translations/en'
import { formatDay } from '@/utils/dates'

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
  const played = formatPlaytime(3409, en.steam, 'en')
  expect(screen.getByTestId('detail')).toHaveTextContent(`${en.steam.playtime}:${played}`)
  unmount()
  render(<XboxLibraryDetail game={GAME} />)
  expect(screen.getByTestId('detail')).not.toHaveTextContent(en.steam.playtime)
})

test('the opened game shows its whole grid, as the other three platforms do: no "see all" cut', () => {
  setup(Array.from({ length: 93 }, (_, i) => xboxAchievementFixture({ id: String(i + 1), name: `A${i + 1}` })))
  render(<XboxLibraryDetail game={GAME} category="playing" />)
  expect(screen.getByTestId('grid').querySelectorAll('li')).toHaveLength(93)
})

test('a game not started: what IGDB knows of it beside the console, asked for only on that list', () => {
  setup()
  ;(useXboxGameDetails as jest.Mock).mockReturnValue({ details: { developers: ['TT Games'], publishers: ['LucasArts'], genres: ['Action'], releaseDate: '2011-03-22', summary: null, screenshots: [] }, isLoading: false })
  const { unmount } = render(<XboxLibraryDetail game={GAME} category="wantToPlay" />)
  expect(useXboxGameDetails).toHaveBeenLastCalledWith(GAME.titleId)
  expect(screen.getByTestId('detail')).toHaveTextContent(`Xbox Series,TT Games,LucasArts,Action,${formatDay('2011-03-22', 'en')}|`)
  unmount()
  render(<XboxLibraryDetail game={GAME} category="playing" />)
  expect(useXboxGameDetails).toHaveBeenLastCalledWith(null)
})
