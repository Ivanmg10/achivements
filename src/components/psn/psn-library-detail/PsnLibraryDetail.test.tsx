const mockDetail = jest.fn()
jest.mock('@/components/library-game-detail/LibraryGameDetail', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockDetail(props)
    return <div data-testid="detail">{props.grid as never}{props.errorNode as never}{props.ringExtra as never}</div>
  },
}))
jest.mock('@/components/psn/psn-trophy-grid/PsnTrophyGrid', () => ({ PsnTrophyGrid: () => <div data-testid="grid" /> }))
jest.mock('@/components/psn/psn-trophy-counts/PsnTrophyCounts', () => ({ __esModule: true, default: () => <div data-testid="counts" /> }))
jest.mock('@/hooks/usePsnTrophies', () => ({ usePsnTrophies: jest.fn() }))

import { fireEvent, render, screen } from '@testing-library/react'
import PsnLibraryDetail from './PsnLibraryDetail'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { en } from '@/translations/en'
import { psnGameFixture } from '@/test-utils/psnFixtures'

const GAME = psnGameFixture({ maxPossible: 40, numAwarded: 12, playtimeMinutes: null })
const t = (id: number, earned: boolean, groupId = 'default') => ({ id, name: `T${id}`, detail: '', iconUrl: null, type: 'bronze', groupId, hidden: false, earned, earnedAt: null, rarity: 10 })
const hook = (o: Record<string, unknown>) => (usePsnTrophies as jest.Mock).mockReturnValue({ trophies: [], groups: [], isLoading: false, error: undefined, retry: jest.fn(), ...o })
const last = () => mockDetail.mock.calls.at(-1)![0]

beforeEach(() => mockDetail.mockClear())

test('before the answer, the ring goes by the list\'s counts, with the trophies by grade beside it', () => {
  hook({ isLoading: true })
  render(<PsnLibraryDetail game={GAME} category="wantToPlay" />)
  expect(last()).toMatchObject({ category: 'wantToPlay', state: 'loading', ring: { earned: 12, total: 40, label: en.psn.trophies } })
  expect(screen.getByTestId('counts')).toBeInTheDocument()
})

test('the ring counts the whole set, DLC trophies included, as the lists do: the platinum alone does not complete a game', () => {
  hook({ trophies: [t(1, true), t(2, false), t(3, true, '001')], groups: [{ id: 'default' }, { id: '001' }] })
  render(<PsnLibraryDetail game={GAME} category="completed" />)
  expect(last()).toMatchObject({ state: 'ready', ring: { earned: 2, total: 3 } })
  expect(last().items).toHaveLength(3)
  expect(screen.getByTestId('grid')).toBeInTheDocument()
})

test('play time is a figure only where Sony has it', () => {
  hook({ trophies: [t(1, true)], groups: [{ id: 'default' }] })
  const { rerender } = render(<PsnLibraryDetail game={GAME} />)
  expect(last().facts).toEqual([])
  rerender(<PsnLibraryDetail game={{ ...GAME, playtimeMinutes: 600 }} />)
  expect(last().facts).toEqual([expect.objectContaining({ label: en.steam.playtime })])
})

test('a private profile explains itself, and retry asks again', () => {
  const retry = jest.fn()
  hook({ error: 'private', retry })
  render(<PsnLibraryDetail game={GAME} />)
  expect(last().state).toBe('error')
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.trophiesError)
  expect(screen.getByText(en.psn.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(retry).toHaveBeenCalled()
})

test('another failure has no privacy hint', () => {
  hook({ error: 'failed' })
  render(<PsnLibraryDetail game={GAME} />)
  expect(screen.queryByText(en.psn.errors.private)).not.toBeInTheDocument()
})
