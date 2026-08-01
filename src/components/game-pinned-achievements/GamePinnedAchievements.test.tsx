import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GamePinnedAchievements } from './GamePinnedAchievements'
import { RetroAchievement } from '@/types/types'

global.fetch = jest.fn()

const unearned: RetroAchievement = {
  ID: 2,
  NumAwarded: 10,
  NumAwardedHardcore: 5,
  Title: 'Locked achievement',
  Description: 'Do the thing',
  Points: 10,
  TrueRatio: 10,
  Author: 'someone',
  AuthorULID: 'a',
  DateModified: '2024-01-01',
  DateCreated: '2024-01-01',
  BadgeName: 'badge1',
  DisplayOrder: 0,
  MemAddr: '0x00',
  Type: null,
  DateEarned: null,
  DateEarnedHardcore: null,
}

const pinnedSnapshot: RetroAchievement = {
  ...unearned,
  ID: 1,
  Title: 'Pinned achievement',
  DateEarned: '2024-01-05',
  DateEarnedHardcore: '2024-01-05',
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('shows a placeholder with a plus when nothing is pinned', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] })
  render(
    <GamePinnedAchievements
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={1}
      achievements={[unearned]}
    />,
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Pin an achievement' })).toBeInTheDocument(),
  )
})

test('shows a message instead of a placeholder when there is nothing left to pin', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] })
  render(<GamePinnedAchievements gameId={1} gameTitle="Game" numDistinctPlayers={1} achievements={[]} />)
  await waitFor(() => expect(screen.getByText('No achievements left to pin')).toBeInTheDocument())
})

test('renders pinned achievement badges', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [{ achievement_id: 1, snapshot: pinnedSnapshot }],
  })
  render(
    <GamePinnedAchievements
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={1}
      achievements={[pinnedSnapshot, unearned]}
    />,
  )
  await waitFor(() => expect(screen.getByAltText('Pinned achievement')).toBeInTheDocument())
})

test('unpins an achievement optimistically', async () => {
  ;(fetch as jest.Mock).mockImplementation((_url: string, opts?: RequestInit) => {
    if (opts?.method === 'DELETE') return Promise.resolve({ ok: true })
    return Promise.resolve({
      ok: true,
      json: async () => [{ achievement_id: 1, snapshot: pinnedSnapshot }],
    })
  })
  render(
    <GamePinnedAchievements
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={1}
      achievements={[pinnedSnapshot, unearned]}
    />,
  )
  await waitFor(() => expect(screen.getByAltText('Pinned achievement')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Unpin Pinned achievement' }))
  await waitFor(() => expect(screen.queryByAltText('Pinned achievement')).not.toBeInTheDocument())
})

test('opens the pin modal from the placeholder', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] })
  render(
    <GamePinnedAchievements
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={1}
      achievements={[unearned]}
    />,
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Pin an achievement' })).toBeInTheDocument(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Pin an achievement' }))
  expect(screen.getByText('Locked achievement')).toBeInTheDocument()
})
