import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import RankingsPage from './RankingsPage'
import { useRankings } from '@/hooks/useRankings'
import { useVaultMe } from '@/hooks/useVaultMe'

jest.mock('@/hooks/useRankings', () => ({ useRankings: jest.fn(), ZONE_MAX: 50 }))
jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: jest.fn() }))
jest.mock('@/hooks/useXboxEnabled', () => ({ useXboxEnabled: () => false }))

const row = (rank: number, username: string, over: Record<string, unknown> = {}) => ({
  username, avatar: null, rank, points: 10_000 - rank * 100, totalPoints: 10_000 - rank * 100, split: { ra: 100 }, completed: 3, achievements: 40, delta: null, isMe: false, trend: [], ...over,
})
const rows = Array.from({ length: 6 }, (_, i) => row(i + 1, `user${i + 1}`))
const retry = jest.fn()
const more = jest.fn()
const widen = jest.fn()
const setup = (over: Record<string, unknown> = {}) =>
  (useRankings as jest.Mock).mockReturnValue({
    data: { scope: 'global', period: 'all', source: 'all', total: 60, offset: 0, rows, me: null, zone: [], zoneStart: 0, hot: [], arrows: true },
    rows, isLoading: false, error: false, retry, more, hasMore: true, loadingMore: false, moreFailed: false,
    widen, widening: false, zoneSize: { above: 2, below: 2 }, ...over,
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

test('signed out: only the global list, names open their public card, and how to join', () => {
  render(<RankingsPage signedIn={false} />)
  expect(screen.queryByRole('tab', { name: en.rankings.following })).not.toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: 'user4' })[0]).toHaveAttribute('href', '/user/user4')
  expect(screen.getByRole('link', { name: en.rankings.joinCta })).toHaveAttribute('href', '/authPage')
})

test('your zone below the list when you are not in it, widened on demand; your level beside', () => {
  const me = row(120, 'me', { isMe: true, listed: true, points: 500, totalPoints: 500 })
  const zone = [row(118, 'above2', { points: 540 }), row(119, 'above1', { points: 520 }), { ...me }, row(121, 'below1', { points: 480 })]
  setup({ data: { total: 200, rows, me, zone, zoneStart: 117, arrows: false } })
  ;(useVaultMe as jest.Mock).mockReturnValue({ me: { points: 500, split: { ra: 500 }, week: 20, month: 80, rank: 120, listed: true, showInRankings: true, provisional: 0, refreshedAt: null } })
  render(<RankingsPage signedIn />)
  const section = screen.getByRole('region', { name: en.rankings.zone })
  expect(section).toHaveTextContent('#120 of 200 · top 60 %')
  expect(section).toHaveTextContent('20 VP ahead')
  expect(section).toHaveTextContent('20 VP behind')
  // Listed and on the page: no pinned bar as well.
  expect(screen.queryByRole('region', { name: en.rankings.yourPlace })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.rankings.zoneUp.replace('{n}', '10') }))
  expect(widen).toHaveBeenCalledWith('up')
  fireEvent.click(screen.getByRole('button', { name: en.rankings.zoneDown.replace('{n}', '10') }))
  expect(widen).toHaveBeenCalledWith('down')
  expect(screen.getByRole('heading', { name: en.rankings.yourLevel })).toBeInTheDocument()
})

test('the zone meets the list: nothing twice, no "more above" once nothing is left between them', () => {
  const me = row(8, 'me', { isMe: true, listed: true, points: 500 })
  const zone = [row(5, 'user5'), row(6, 'user6'), row(7, 'seven'), { ...me }]
  setup({ data: { total: 8, rows, me, zone, zoneStart: 4, arrows: false } })
  render(<RankingsPage signedIn />)
  const section = screen.getByRole('region', { name: en.rankings.zone })
  // Ranks 5 and 6 are already in the list above (six rows): the zone starts at 7.
  expect(section).not.toHaveTextContent('user5')
  expect(section).toHaveTextContent('seven')
  expect(screen.queryByRole('button', { name: /more above/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /more below/ })).not.toBeInTheDocument()
})

test('says why when you are not listed', () => {
  const me = row(9, 'me', { isMe: true, listed: false })
  setup({ data: { total: 6, rows, me, zone: [], zoneStart: 0, arrows: false } })
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

  setup({ rows: [], data: { total: 0, rows: [], me: null, zone: [], zoneStart: 0, arrows: false } })
  rerender(<RankingsPage signedIn />)
  fireEvent.click(screen.getByRole('tab', { name: en.rankings.following }))
  expect(screen.getByText(en.rankings.emptyFollowing)).toBeInTheDocument()
})

test('beside your level, who is most active this week, and a way to that ranking', () => {
  setup({ data: { total: 60, rows, me: null, zone: [], zoneStart: 0, arrows: true, hot: [row(1, 'blazing', { points: 677 })] } })
  render(<RankingsPage signedIn />)
  const hot = screen.getByRole('region', { name: en.rankings.hotTitle })
  expect(hot).toHaveTextContent('blazing')
  expect(hot).toHaveTextContent('+677')
  fireEvent.click(screen.getByRole('button', { name: en.rankings.hotSee }))
  expect(useRankings).toHaveBeenLastCalledWith({ scope: 'global', period: 'week', source: 'all' })
  // Already on the weekly ranking: no way to it.
  expect(screen.queryByRole('button', { name: en.rankings.hotSee })).not.toBeInTheDocument()
})

test('leads to how points work', () => {
  render(<RankingsPage signedIn />)
  expect(screen.getByRole('link', { name: en.rankings.how })).toHaveAttribute('href', '/rankings/how')
})
