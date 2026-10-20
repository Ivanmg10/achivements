import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import RankingsPage from './RankingsPage'
import { useRankings } from '@/hooks/useRankings'
import { useVaultMe } from '@/hooks/useVaultMe'

jest.mock('@/hooks/useRankings', () => ({ useRankings: jest.fn() }))
jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: jest.fn() }))
jest.mock('@/hooks/useXboxEnabled', () => ({ useXboxEnabled: () => false }))

const row = (rank: number, username: string, over: Record<string, unknown> = {}) => ({
  username, avatar: null, rank, points: 10_000 - rank * 100, totalPoints: 10_000 - rank * 100, split: { ra: 100 }, completed: 3, achievements: 40, delta: null, isMe: false, ...over,
})
const rows = Array.from({ length: 6 }, (_, i) => row(i + 1, `user${i + 1}`))
const retry = jest.fn()
const more = jest.fn()
const setup = (over: Record<string, unknown> = {}) =>
  (useRankings as jest.Mock).mockReturnValue({
    data: { scope: 'global', period: 'all', source: 'all', total: 60, offset: 0, rows, me: null, near: [], arrows: true },
    rows, isLoading: false, error: false, retry, more, hasMore: true, loadingMore: false, moreFailed: false, ...over,
  })

beforeEach(() => {
  jest.clearAllMocks()
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: null })
  setup()
})

test('a podium for the first three, then the table, and more on demand', () => {
  render(<RankingsPage signedIn />)
  expect(screen.getByRole('heading', { level: 1, name: /Rankings/ })).toBeInTheDocument()
  expect(screen.getByText(en.rankings.beta)).toBeInTheDocument()
  const podium = screen.getByRole('list', { name: en.rankings.title })
  expect(podium).toHaveTextContent('user1')
  expect(screen.getByRole('table')).toHaveTextContent('user4')
  // The places moved this week, on the view that has them.
  expect(screen.getByRole('columnheader', { name: en.rankings.colChange })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.rankings.more }))
  expect(more).toHaveBeenCalled()
})

test('changing the view asks for it', () => {
  render(<RankingsPage signedIn />)
  fireEvent.click(screen.getByRole('tab', { name: en.rankings.following }))
  expect((useRankings as jest.Mock).mock.calls.at(-1)[0]).toEqual({ scope: 'following', period: 'all', source: 'all' })
  fireEvent.click(screen.getByRole('button', { name: en.rankings.week }))
  expect((useRankings as jest.Mock).mock.calls.at(-1)[0]).toMatchObject({ period: 'week' })
  expect(screen.getByRole('button', { name: en.rankings.week })).toHaveAttribute('aria-pressed', 'true')
})

test('signed out: only the global list, no profile links, and how to join', () => {
  render(<RankingsPage signedIn={false} />)
  expect(screen.queryByRole('tab', { name: en.rankings.following })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'user4' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.rankings.joinCta })).toHaveAttribute('href', '/authPage')
})

test('where you stand, pinned, when you are not on the page; your level beside', () => {
  const me = row(120, 'me', { isMe: true, listed: true, points: 500, totalPoints: 500 })
  setup({ data: { total: 200, rows, me, near: [row(119, 'above', { points: 520 })], arrows: false } })
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: { points: 500, split: { ra: 500 }, week: 20, month: 80, rank: 120, listed: true, showInRankings: true, provisional: 0, refreshedAt: null } })
  render(<RankingsPage signedIn />)
  const bar = screen.getByRole('region', { name: en.rankings.yourPlace })
  expect(bar).toHaveTextContent('#120')
  expect(bar).toHaveTextContent('21 VP to #119')
  expect(screen.getByRole('heading', { name: en.rankings.yourLevel })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: en.rankings.near })).toBeInTheDocument()
})

test('says why when you are not listed', () => {
  const me = row(9, 'me', { isMe: true, listed: false })
  setup({ data: { total: 6, rows, me, near: [], arrows: false } })
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: { points: 9100, split: {}, week: 0, month: 0, rank: 9, listed: false, showInRankings: false, provisional: 0, refreshedAt: null } })
  render(<RankingsPage signedIn />)
  expect(screen.getByText(en.rankings.optedOutNote)).toBeInTheDocument()
})

test('loading, failure with retry, and an empty Following', () => {
  setup({ isLoading: true, rows: [] })
  const { rerender } = render(<RankingsPage signedIn />)
  expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()

  setup({ error: true, rows: [] })
  rerender(<RankingsPage signedIn />)
  fireEvent.click(screen.getByRole('button', { name: en.rankings.retry }))
  expect(retry).toHaveBeenCalled()

  setup({ rows: [], data: { total: 0, rows: [], me: null, near: [], arrows: false } })
  rerender(<RankingsPage signedIn />)
  fireEvent.click(screen.getByRole('tab', { name: en.rankings.following }))
  expect(screen.getByText(en.rankings.emptyFollowing)).toBeInTheDocument()
})

test('leads to how points work', () => {
  render(<RankingsPage signedIn />)
  expect(screen.getByRole('link', { name: en.rankings.how })).toHaveAttribute('href', '/rankings/how')
})
