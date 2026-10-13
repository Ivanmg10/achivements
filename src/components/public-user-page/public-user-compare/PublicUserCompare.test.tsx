import { render, screen } from '@testing-library/react'
import PublicUserCompare, { type ViewerStats } from './PublicUserCompare'
import { useStreakData } from '@/hooks/useStreakData'
import type { LibraryGame } from '@/utils/library'
import { en } from '@/translations/en'

jest.mock('@/hooks/useStreakData', () => ({ useStreakData: jest.fn() }))
jest.mock('../public-user-shared-game-row/PublicUserSharedGameRow', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <span>{game.title}</span>,
}))

const NOW = Date.parse('2026-10-13T12:00:00Z')
const USER = { username: 'ivan', avatar: null, description: null, location: null, ra: 'IvanRA', steam: false, psn: false }
const game = (key: string, pct: number): LibraryGame => {
  const [source, id] = key.split(':')
  return { key, source: source as LibraryGame['source'], id: Number(id), title: key, subtitle: '', status: pct >= 100 ? 'completed' : 'playing', pct, href: '' }
}
const VIEWER: ViewerStats = {
  name: 'me', avatar: 'https://x/me.png', games: [game('ra:1', 20), game('ra:9', 100)], year: [{ Date: '2026-10-13 09:00:00' }] as never[],
  activeStreak: { days: 2 } as never, bestStreak: { days: 3 } as never, isLoading: false,
}

function setup(theirYear = 3, loading = false) {
  ;(useStreakData as jest.Mock).mockReturnValue({
    achievements: Array.from({ length: theirYear }, () => ({ Date: '2026-10-12 09:00:00' })),
    activeStreak: { days: 5 },
    bestStreak: { days: 3 },
    now: NOW,
    isLoading: loading,
  })
}

const row = (label: string) => screen.getByText(label).closest('li')!

test('each measure side by side, theirs first', () => {
  setup()
  render(<PublicUserCompare user={USER} games={[game('ra:1', 80), game('ra:2', 10)]} gamesLoading={false} viewer={VIEWER} />)
  expect(row(en.userProfile.lastYear)).toHaveTextContent(/^3.*1$/)
  expect(row(en.userProfile.streak)).toHaveTextContent(/^5.*2$/)
  expect(row(en.userProfile.gamesCompleted)).toHaveTextContent(/^0.*1$/)
  expect(row(en.userProfile.avgProgress)).toHaveTextContent(/^45%.*60%$/)
})

test('counts how many measures each side leads', () => {
  setup()
  render(<PublicUserCompare user={USER} games={[game('ra:1', 80), game('ra:2', 10)]} gamesLoading={false} viewer={VIEWER} />)
  // Them: week, month, year, streak. You: completed, average. Even: best streak, games played.
  expect(screen.getAllByText(en.userProfile.wins.replace('{n}', '4'))).toHaveLength(1)
  expect(screen.getAllByText(en.userProfile.wins.replace('{n}', '2'))).toHaveLength(1)
})

test('lists the games you both play', () => {
  setup()
  render(<PublicUserCompare user={USER} games={[game('ra:1', 80), game('ra:2', 10)]} gamesLoading={false} viewer={VIEWER} />)
  expect(screen.getByText('ra:1')).toBeInTheDocument()
  expect(screen.queryByText('ra:2')).not.toBeInTheDocument()
})

test('says so when there are none', () => {
  setup()
  render(<PublicUserCompare user={USER} games={[game('psn:5', 10)]} gamesLoading={false} viewer={VIEWER} />)
  expect(screen.getByText(en.userProfile.noSharedGames)).toBeInTheDocument()
})

test('a long shared list shows the first ones and how many more', () => {
  setup()
  const many = Array.from({ length: 30 }, (_, i) => game(`ra:${i + 100}`, 50))
  render(<PublicUserCompare user={USER} games={many} gamesLoading={false} viewer={{ ...VIEWER, games: many }} />)
  expect(screen.getByText(en.userProfile.sharedMore.replace('{n}', '6'))).toBeInTheDocument()
})

test('waits for both sides before comparing', () => {
  setup(3, true)
  render(<PublicUserCompare user={USER} games={[]} gamesLoading={false} viewer={VIEWER} />)
  expect(screen.getByText(en.userProfile.loadingCompare)).toBeInTheDocument()
  expect(screen.queryByText(en.userProfile.lastYear)).not.toBeInTheDocument()
})
